# Déploiement sur VPS — ascamberene.sn

Deux voies, au choix :

| | [Docker](#déploiement-docker-recommandé) | [Installation directe](#installation-directe) |
|---|---|---|
| À installer sur le VPS | Docker, Apache, certbot | Node, Apache, certbot |
| Mise à jour | `./deploy/docker.sh deploy` | `./deploy/deploy.sh` |
| Reproductible | oui, image identique partout | dépend de la machine |

La base est **MongoDB Atlas** dans les deux cas : rien à installer ni à
sauvegarder soi-même de ce côté.

Docker demande moins de choses au VPS et rend la mise à jour plus sûre : si une
image ne construit pas, rien n'est remplacé. La section suivante le décrit ;
l'installation directe vient après, inchangée.

Dans les deux cas, l'Apache de l'hôte porte le certificat et une seule origine
sert tout — le navigateur ne fait donc aucune requête préalable CORS.

---

## Déploiement Docker (recommandé)

```
navigateur ──► Apache de l'hôte :443 ──► conteneur web :8080 ──┬─► /api      ──► conteneur api :4100
                    (certificat)          (site + proxy)       ├─► /uploads  ──► conteneur api :4100
                                                               └─► reste     ──► fichiers statiques
                                                                        conteneur api ──► MongoDB Atlas
```

Deux conteneurs seulement. Seul `web` publie un port, et uniquement sur
`127.0.0.1` : l'API n'est joignable que depuis le réseau interne de la pile.

### 1. Sur le VPS

```bash
sudo apt update && sudo apt install -y apache2 git curl
sudo a2enmod proxy proxy_http headers

# Docker par le script officiel : il installe aussi le greffon Compose v2,
# que le paquet `docker.io` des dépôts n'apporte pas.
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker

# Si vous n'êtes pas root, se donner l'accès au démon puis se reconnecter :
sudo usermod -aG docker "$USER"
```

Vérifier avant d'aller plus loin — `./deploy/docker.sh` refusera de démarrer
tant que ces deux commandes ne répondent pas :

```bash
docker version && docker compose version
```

### 2. Préparer MongoDB Atlas

Dans la console Atlas :

1. **Database Access** — créer un utilisateur dédié au site, avec le rôle
   *Read and write to any database* (ou restreint à `asc_camberene`).
2. **Network Access** — autoriser l'adresse IP du VPS. Sans cette étape, la
   connexion expire au bout de trente secondes sans message explicite : c'est
   la panne la plus fréquente au premier démarrage.
3. **Database → Connect → Drivers** — copier la chaîne de connexion.

Trois pièges dans cette chaîne :

- **le nom de la base doit y figurer**, après le nom d'hôte. Sans lui, le
  serveur écrit dans une base nommée `test` et le site paraît vide :

  ```
  mongodb+srv://user:mdp@cluster.mongodb.net/asc_camberene?retryWrites=true&w=majority
                                             ^^^^^^^^^^^^^
  ```

- **un mot de passe contenant `@ : / ? #` doit être encodé** (`@` → `%40`,
  `:` → `%3A`). Sinon l'URI est coupée au mauvais endroit ;
- `mongodb+srv://` demande une résolution DNS SRV : elle échoue si le pare-feu
  du VPS bloque les requêtes DNS sortantes.

### 3. Cloner et configurer

```bash
sudo mkdir -p /var/www && sudo chown "$USER" /var/www
git clone git@github.com:Diilaye/as-camberene.git /var/www/as-camberene
cd /var/www/as-camberene

cp .env.docker.example .env.docker
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"  # ×2
nano .env.docker      # SITE_URL, MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

> `SITE_URL` est inscrite dans le bundle au moment de la construction : la
> changer impose de reconstruire l'image, pas seulement de redémarrer.

> Pour une base en conteneur plutôt qu'Atlas — machine de test, installation
> sans service externe — mettre `LOCAL_DB=1` dans `.env.docker` : la surcouche
> `docker-compose.local-db.yml` ajoute alors un MongoDB et son volume, et
> `MONGODB_URI` est ignorée.

### 4. Démarrer

```bash
./deploy/docker.sh up
```

Le script construit les images, démarre la pile et **attend qu'elle réponde
vraiment** avant de rendre la main. En cas d'échec, il affiche les journaux.

### 5. Apache et certificat

```bash
sudo cp deploy/apache-docker.conf /etc/apache2/sites-available/ascambere.conf
sudo a2ensite ascambere && sudo a2dissite 000-default
sudo apache2ctl configtest && sudo systemctl reload apache2

sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d ascamberene.sn -d www.ascamberene.sn
```

Reprendre ensuite dans le vhost 443 généré par certbot les deux en-têtes
`X-Forwarded-*` en `https`/`443` — l'API en a besoin pour distinguer les
visiteurs derrière le proxy.

### 6. Premier compte et contenu

```bash
./deploy/docker.sh superadmin direction@ascamberene.sn
./deploy/docker.sh seed          # facultatif : contenu de démonstration
```

### Le script au quotidien

```
./deploy/docker.sh up                    construit et démarre
./deploy/docker.sh deploy                git pull, reconstruit, redémarre, vérifie
./deploy/docker.sh status                état des conteneurs
./deploy/docker.sh logs [service]        journaux en continu
./deploy/docker.sh shell [service]       un shell dans un conteneur
./deploy/docker.sh superadmin <email>    crée un compte d'administration
./deploy/docker.sh seed                  charge le contenu de démonstration
./deploy/docker.sh backup                sauvegarde base + images téléversées
./deploy/docker.sh restore <archive>     restaure une sauvegarde
./deploy/docker.sh down                  arrête (base et images conservées)
```

`down` ne touche jamais aux volumes : la base et les images téléversées
survivent à un arrêt comme à une reconstruction d'image.

### Sauvegardes

Atlas sauvegarde la base de son côté, mais **pas les images téléversées** :
elles vivent dans un volume Docker sur le VPS, et rien d'autre ne les protège.

```bash
./deploy/docker.sh backup      # → backups/mongo-*.archive.gz et uploads-*.tgz
```

La commande sauvegarde les deux : un export de la base — utile pour partir avec
une copie hors d'Atlas — et l'archive des images. Les outils MongoDB ne sont
dans aucune image de la pile : le script les emprunte à un conteneur jetable, et
passe l'URI par l'environnement pour qu'elle n'apparaisse pas dans la liste des
processus de l'hôte.

À planifier, par exemple chaque nuit :

```
0 3 * * * cd /var/www/as-camberene && ./deploy/docker.sh backup
```

### Passer d'Atlas à une base sur le serveur

Atlas impose des limites à ses offres d'entrée — dont **500 collections par
cluster, toutes bases confondues**. Un cluster partagé avec d'autres projets
finit par les atteindre, et le site répond alors 500 sur toute écriture qui
demande une collection encore inexistante : la lecture continue de marcher, ce
qui rend le symptôme déroutant.

Héberger la base sur le VPS lève cette limite. La bascule se fait sans perdre
de données, mais **l'ordre compte** : la sauvegarde doit être prise pendant que
`.env.docker` désigne encore Atlas, sinon le script sauvegarde la base locale,
qui est vide.

```bash
cd /opt/as-camberene

# 1. Copie complète d'Atlas — LOCAL_DB vaut encore 0
./deploy/docker.sh backup

# 2. Bascule : LOCAL_DB=1 dans .env.docker
#    Garder la ligne MONGODB_URI : elle est ignorée, mais permet de revenir
#    à Atlas en remettant LOCAL_DB=0.
nano .env.docker

# 3. Démarrage de la pile avec son MongoDB
./deploy/docker.sh up

# 4. Restauration dans la base du serveur
./deploy/docker.sh restore backups/mongo-<horodatage>.archive.gz
```

Entre le démarrage et la restauration, le site tourne sur une base vide : la
bascule se fait donc de préférence à une heure creuse.

Vérifier ensuite que le contenu est bien arrivé :

```bash
docker compose --env-file .env.docker exec api node -e "
const m = require('mongoose');
m.connect(process.env.MONGODB_URI).then(async () => {
  for (const c of await m.connection.db.listCollections().toArray()) {
    console.log(String(await m.connection.db.collection(c.name).countDocuments()).padStart(6), c.name);
  }
  process.exit(0);
});"
```

Ce qui change une fois la base sur le serveur :

- **Les sauvegardes deviennent votre affaire.** Atlas en prenait ; le conteneur
  n'en prend aucune. Planifier `./deploy/docker.sh backup` chaque nuit n'est
  plus une précaution, c'est la seule copie qui existe.
- **Le volume `mongo-data` porte toute la base.** `docker compose down -v`
  l'efface — ne jamais employer `-v` sur cette pile.
- **La mémoire du VPS devient un facteur.** MongoDB en demande quelques
  centaines de mégaoctets ; vérifier avec `free -h` avant de basculer.
- La base n'écoute que sur le réseau Docker, sans port publié : elle n'est pas
  joignable depuis Internet, et c'est ce qui permet de s'en tenir là sans
  authentification.

### Dépannage

| Symptôme | Où regarder |
|---|---|
| **Apache sert un autre site** | `apache2ctl -S` : voir plus bas |
| `docker: command not found` | Docker n'est pas installé — voir [§1](#1-sur-le-vps) |
| Une correction du script ne s'applique pas | `deploy` se relance seul si le script a changé ; sinon relancer la commande |
| `Le démon Docker ne répond pas` | `sudo systemctl enable --now docker` |
| `up` échoue à la vérification | `./deploy/docker.sh logs` |
| 502 depuis l'hôte | la pile tourne-t-elle ? `./deploy/docker.sh status` |
| Port déjà pris | changer `WEB_PORT` dans `.env.docker`, **et** `SITE_URL` si le port est public |
| Secret ou URI manquant | le script le dit avant de démarrer quoi que ce soit |
| Connexion à Atlas qui expire | l'IP du VPS est-elle dans Atlas → Network Access ? |
| 500 à la création, 200 à la lecture | `already using 500 collections of 500` dans les journaux : limite d'Atlas atteinte, voir [Passer d'Atlas à une base sur le serveur](#passer-datlas-à-une-base-sur-le-serveur) |
| Site vide alors que la base existe | le nom de la base manque dans `MONGODB_URI` |
| `authentication failed` | mot de passe non encodé, ou utilisateur sans droits |
| Images 403 | droits des fichiers ; l'image les normalise, reconstruire avec `--no-cache` |

### Apache sert un autre site que le vôtre

Symptôme : `https://ascamberene.sn` affiche un tout autre site hébergé sur la
même machine.

Apache ne rend pas d'erreur quand aucun vhost ne correspond au domaine
demandé : il sert **le premier de la liste**, par ordre alphabétique de fichier
dans `sites-enabled`. Un `ServerName` mal orthographié, un site non activé ou
un vhost absent en HTTPS produisent donc tous le même symptôme — le site d'un
voisin.

```bash
apache2ctl -S
```

La sortie liste, port par port, quel vhost répond à quel nom. Y chercher trois
choses :

1. **`ascamberene.sn` figure-t-il en `*:443` ?** S'il n'apparaît qu'en `*:80`,
   certbot n'a pas encore créé le vhost HTTPS — c'est lui qui le génère :

   ```bash
   sudo certbot --apache -d ascamberene.sn -d www.ascamberene.sn
   ```

2. **Le nom est-il exactement le bon ?** Une lettre de différence suffit à ce
   qu'aucun vhost ne corresponde.

3. **Le site est-il activé ?**

   ```bash
   ls -l /etc/apache2/sites-enabled/
   sudo a2ensite ascamberene && sudo systemctl reload apache2
   ```

La ligne `default server` de la sortie indique qui répond quand rien ne
correspond : c'est le site que vous voyez à tort.

---

## Installation directe

Site construit servi par Apache, API Node derrière le même domaine, MongoDB
local. Une seule origine : Apache transmet `/api` et `/uploads` au serveur
Node, tout le reste est du fichier statique.

```
navigateur ──► Apache :443 ──┬─► /api      ──► Node :4100
                             ├─► /uploads  ──► Node :4100
                             └─► reste     ──► /var/www/as-camberene/frontend/dist
                                                        Node ──► MongoDB :27017
```

---

## 1. DNS

Deux enregistrements A vers l'IP du VPS :

| Type | Nom | Valeur |
|---|---|---|
| A | `ascamberene.sn` | `<IP du VPS>` |
| A | `www` | `<IP du VPS>` |

Attendre la propagation avant l'étape du certificat :

```bash
dig +short ascamberene.sn
```

## 2. Paquets

Sur Debian ou Ubuntu :

```bash
sudo apt update
sudo apt install -y apache2 git curl

# Node 20 LTS — la version des dépôts est trop ancienne
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

sudo a2enmod proxy proxy_http rewrite headers expires deflate
```

La base étant hébergée chez Atlas, rien à installer de ce côté — voir
[Préparer MongoDB Atlas](#2-préparer-mongodb-atlas) pour l'utilisateur, la
liste d'adresses autorisées et la chaîne de connexion.

## 3. Clé de déploiement et clonage

Le dépôt est privé : le VPS a besoin de sa propre clé, en lecture seule.

```bash
sudo -u www-data ssh-keygen -t ed25519 -C "vps-ascambere" -f /var/www/.ssh/id_ed25519 -N ""
sudo -u www-data cat /var/www/.ssh/id_ed25519.pub
```

Coller cette clé dans **GitHub → dépôt `as-camberene` → Settings → Deploy keys**,
sans cocher l'accès en écriture, puis :

```bash
sudo mkdir -p /var/www && sudo chown www-data:www-data /var/www
sudo -u www-data git clone git@github.com:Diilaye/as-camberene.git /var/www/as-camberene
```

## 4. Variables d'environnement

Le fichier `backend/.env` **n'est pas dans le dépôt** : il porte les secrets et
se crée sur le serveur.

```bash
cd /var/www/as-camberene/backend
sudo -u www-data cp .env.example .env

# Deux secrets distincts, longs, tirés au hasard
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

sudo -u www-data nano .env
```

À renseigner :

```ini
NODE_ENV=production
PORT=4100
MONGODB_URI=mongodb+srv://<user>:<mdp>@<cluster>.mongodb.net/asc_camberene?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<premier secret>
JWT_REFRESH_SECRET=<second secret>
CORS_ORIGINS=https://ascamberene.sn,https://www.ascamberene.sn
```

> Le serveur refuse de démarrer si un secret a gardé sa valeur d'exemple et que
> `NODE_ENV=production`. C'est voulu : un JWT prévisible se forge.

Le site, lui, lit `.env.production` qui **est** dans le dépôt — il ne contient
aucun secret, seulement l'URL publique de l'API.

## 5. Première construction

```bash
cd /var/www/as-camberene/frontend
sudo -u www-data npm ci
sudo -u www-data npm run build          # → frontend/dist/

cd ../backend
sudo -u www-data npm ci
sudo -u www-data npm run build          # → backend/dist/index.js et backend/dist-scripts/
sudo -u www-data mkdir -p uploads
```

`npm run build` construit l'API **et** les scripts d'administration. Ces
derniers sont écrits en TypeScript : sans cette construction, ils n'existent
que sous une forme que Node ne sait pas lire, et `tsx` — qui s'en charge en
développement — peut manquer sur un serveur installé sans les dépendances de
développement (`npm ci --omit=dev`, ou un `NODE_ENV=production` qui pousse npm
à les omettre). C'est exactement l'étape 9 qui échouerait, sur `tsx: not
found`, au moment de créer le premier compte.

## 6. Service de l'API

```bash
sudo cp /var/www/as-camberene/deploy/asc-camberene-api.service \
        /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now asc-camberene-api
sudo systemctl status asc-camberene-api
curl -s http://127.0.0.1:4100/health
```

## 7. Apache

```bash
sudo cp /var/www/as-camberene/deploy/apache-ascamberene.conf \
        /etc/apache2/sites-available/ascambere.conf
sudo a2ensite ascambere
sudo a2dissite 000-default
sudo apache2ctl configtest && sudo systemctl reload apache2
```

## 8. HTTPS

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d ascamberene.sn -d www.ascamberene.sn
```

Certbot crée le vhost 443 et la redirection depuis le port 80. Le
renouvellement est automatique ; le vérifier une fois :

```bash
sudo certbot renew --dry-run
```

Une fois le certificat vérifié, activer HSTS dans le vhost 443 :

```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

> À n'ajouter qu'après avoir confirmé que HTTPS fonctionne : les navigateurs
> mémorisent cette directive et refuseront ensuite tout accès en clair.

## 9. Premiers comptes

Un site neuf n'a aucun compte, et la route qui en crée est réservée au super
administrateur : il faut donc ouvrir le premier depuis le serveur. Le plus
court ouvre les deux d'un coup — la direction, qui distribue les rôles, et
l'administrateur qui tient le contenu au quotidien :

```bash
cd /var/www/as-camberene/backend
sudo -u www-data npm run bootstrap:admins -- \
  --superadmin direction@ascamberene.sn \
  --admin redaction@ascamberene.sn
```

Les mots de passe sont tirés au sort et affichés **une seule fois** : ils ne
sont stockés que hachés, rien ne permet de les relire. Les noter avant de
fermer le terminal.

La commande est rejouable : relancée, elle laisse intacts les comptes déjà en
place. `--reset-passwords` en tire de nouveaux — c'est le chemin de
récupération quand plus personne ne peut se connecter.

Pour un seul compte, ou pour un profil autre (`journalist`, `shop-admin`) :

```bash
sudo -u www-data npm run create:superadmin -- direction@ascamberene.sn --password 'un-mot-de-passe-long'
sudo -u www-data npm run create:user -- boutique@ascamberene.sn --role shop-admin
```

Puis connexion sur `https://ascamberene.sn/login` — les autres comptes se créent
depuis `https://ascamberene.sn/admin/utilisateurs`.

Pour partir avec le contenu de démonstration (actualités, boutique, légendes,
frise) :

```bash
sudo -u www-data npm run seed
```

Les buts et passes décisives des joueurs se reportent d'eux-mêmes à chaque
feuille de match enregistrée. Pour les recompter entièrement à partir des
matchs terminés — après une reprise de données, ou si des corrections à la main
les ont décalés :

```bash
sudo -u www-data npm run recount:stats
```

Les chiffres saisis à la main dans l'onglet « Statistiques » sont alors
remplacés par ceux des feuilles de match ; matchs joués et cartons ne changent
pas.

---

## Mises à jour

```bash
sudo -u www-data /var/www/as-camberene/deploy/deploy.sh
```

Le script récupère les sources, reconstruit les deux parties, redémarre l'API
et vérifie qu'elle répond. Il s'arrête à la première erreur plutôt que de
laisser un site à moitié déployé.

`www-data` doit pouvoir redémarrer le service sans mot de passe :

```bash
echo 'www-data ALL=(root) NOPASSWD: /bin/systemctl restart asc-camberene-api' \
  | sudo tee /etc/sudoers.d/asc-camberene-deploy
sudo chmod 440 /etc/sudoers.d/asc-camberene-deploy
```

## Sauvegardes

Atlas sauvegarde la base ; les images téléversées, elles, ne vivent que sur le
VPS :

```bash
tar czf /var/backups/uploads-$(date +%F).tgz -C /var/www/as-camberene/backend uploads
```

Le reste — code, dépendances, site construit — se reconstruit depuis le dépôt.

## Dépannage

| Symptôme | Où regarder |
|---|---|
| Page blanche | `frontend/dist/` construit ? `sudo -u www-data npm run build` |
| 404 en rechargeant `/admin/...` | `FallbackResource` absent, ou `mod_rewrite` non activé |
| `/api` renvoie du HTML | `mod_proxy` non activé, ou `ProxyPass` après le repli SPA |
| 502 sur `/api` | `systemctl status asc-camberene-api` |
| L'API ne démarre pas | `journalctl -u asc-camberene-api -n 50` — souvent un secret manquant |
| Images téléversées absentes | droits sur `backend/uploads` pour `www-data` |
