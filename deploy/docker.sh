#!/usr/bin/env bash
#
# Pilote de la pile Docker du site ASC Cambérène.
#
#   ./deploy/docker.sh <commande>
#
# Toutes les commandes passent par le même fichier d'environnement et le même
# projet Compose : il n'y a qu'une pile, et on ne risque pas d'en démarrer une
# seconde avec des secrets différents.

set -euo pipefail

# Le script est appelable depuis n'importe où : on se replace à la racine du
# projet, qui est le dossier parent de celui-ci.
SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-$ROOT/.env.docker}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"

# ---------------------------------------------------------------------------
# Outils
# ---------------------------------------------------------------------------

red()  { printf '\033[31m%s\033[0m\n' "$*"; }
green(){ printf '\033[32m%s\033[0m\n' "$*"; }
step() { printf '\033[1m→ %s\033[0m\n' "$*"; }

die() { red "✗ $*"; exit 1; }

# `LOCAL_DB=1` dans .env.docker ajoute une base en conteneur ; sans lui, la
# pile s'adresse à la base désignée par MONGODB_URI (Atlas).
compose() {
  local files=(-f docker-compose.yml)
  if [ -f "$ENV_FILE" ] && grep -qE '^LOCAL_DB=1' "$ENV_FILE"; then
    files+=(-f docker-compose.local-db.yml)
  fi
  docker compose --env-file "$ENV_FILE" "${files[@]}" "$@"
}

# La base est-elle dans la pile, ou ailleurs ?
uses_local_db() { [ -f "$ENV_FILE" ] && grep -qE '^LOCAL_DB=1' "$ENV_FILE"; }

# Valeur d'une clé du fichier d'environnement.
env_value() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true; }

# Docker est-il là, et utilisable ? Sans cette vérification, la première
# commande échouait sur un « docker: command not found » au milieu d'une étape,
# sans dire quoi installer.
require_docker() {
  if ! command -v docker > /dev/null 2>&1; then
    red "✗ Docker n'est pas installé sur cette machine."
    cat <<'INSTALL'

  Installation (Debian / Ubuntu), script officiel — installe aussi le
  greffon Compose v2 :

    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker

  Puis vérifier :

    docker version && docker compose version

INSTALL
    exit 1
  fi

  if ! docker info > /dev/null 2>&1; then
    red "✗ Le démon Docker ne répond pas."
    echo "  Le démarrer :  systemctl enable --now docker"
    echo "  Si vous n'êtes pas root, vous rejoindre au groupe docker :"
    echo "      usermod -aG docker \"\$USER\"   puis se reconnecter"
    exit 1
  fi

  if ! docker compose version > /dev/null 2>&1; then
    red "✗ Le greffon Docker Compose v2 est absent."
    echo "  Sur Debian / Ubuntu :  apt install -y docker-compose-plugin"
    echo "  Ou réinstaller Docker :  curl -fsSL https://get.docker.com | sh"
    exit 1
  fi
}

# Le fichier d'environnement seul : Compose en a besoin pour toute commande,
# même celles qui ne démarrent rien.
require_env_file() {
  require_docker
  [ -f "$ENV_FILE" ] || die "$ENV_FILE est absent. Le créer :  cp .env.docker.example .env.docker"
}

require_env() {
  require_env_file

  # Un secret vide passerait la substitution Compose et ne serait rattrapé
  # qu'au démarrage du conteneur, dans un journal. Autant le dire ici.
  local required=(SITE_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET)
  # Avec une base en conteneur, l'URI est fournie par la surcouche.
  uses_local_db || required+=(MONGODB_URI)

  local missing=()
  local key
  for key in "${required[@]}"; do
    grep -qE "^${key}=.+" "$ENV_FILE" || missing+=("$key")
  done
  [ ${#missing[@]} -eq 0 ] || die "À renseigner dans $ENV_FILE : ${missing[*]}"
}

# ---------------------------------------------------------------------------
# Commandes
# ---------------------------------------------------------------------------

cmd_up() {
  require_env
  step "Construction des images"
  compose build "$@"
  step "Démarrage de la pile"
  compose up -d
  cmd_wait
}

cmd_down() {
  require_env_file
  step "Arrêt de la pile"
  # Les volumes sont conservés : `down` ne doit jamais effacer la base.
  compose down
  green "✓ Pile arrêtée (base et images téléversées conservées)"
}

cmd_restart() { require_env; compose restart "$@"; cmd_wait; }

cmd_logs()   { require_env_file; compose logs -f --tail=100 "$@"; }
cmd_status() { require_env_file; compose ps; }
cmd_shell()  { require_env_file; compose exec "${1:-api}" sh; }

# Attend que la pile réponde vraiment, plutôt que de rendre la main dès que les
# conteneurs sont créés.
cmd_wait() {
  step "Vérification"
  local port
  port="$(grep -E '^WEB_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || true)"
  port="${port:-8080}"

  local i
  for i in $(seq 1 30); do
    if curl -fsS -o /dev/null "http://127.0.0.1:${port}/" \
       && curl -fsS -o /dev/null "http://127.0.0.1:${port}/api/products"; then
      green "✓ Site et API répondent sur 127.0.0.1:${port}"
      return 0
    fi
    sleep 2
  done

  red "✗ La pile ne répond pas après 60 s. Derniers journaux :"
  compose logs --tail=40
  return 1
}

cmd_deploy() {
  require_env

  # `--no-pull` : passe déjà relancée après une mise à jour du script.
  if [ "${1:-}" != "--no-pull" ]; then
    step "Récupération des sources"
    local before after
    before="$(git rev-parse HEAD)"
    # `--ff-only` : un déploiement ne résout pas de conflit.
    git pull --ff-only
    after="$(git rev-parse HEAD)"

    # Bash lit un script au fil de son exécution. Si `git pull` vient de
    # réécrire celui-ci, la suite serait lue à la mauvaise position dans le
    # nouveau fichier — au mieux une erreur de syntaxe, au pire des lignes
    # exécutées de travers. C'est exactement ce qui fait qu'une correction
    # apportée au script ne s'applique jamais au déploiement qui la récupère.
    # On repart donc proprement de la version à jour.
    if [ "$before" != "$after" ] && ! git diff --quiet "$before" "$after" -- "$SELF"; then
      step "Le script a changé : reprise avec la nouvelle version"
      exec "$SELF" deploy --no-pull
    fi
  fi

  cmd_up
  green "✓ Déploiement terminé"
}

cmd_superadmin() {
  require_env
  local email="${1:-}"
  [ -n "$email" ] || die "Usage : $0 superadmin <email> [mot-de-passe]"
  shift
  local pass="${1:-}"

  step "Création du super administrateur"
  if [ -n "$pass" ]; then
    compose exec -T api npm run create:superadmin -- "$email" --password "$pass"
  else
    # Sans mot de passe fourni, le script en tire un au sort et l'affiche une
    # seule fois : il n'est pas stocké en clair, donc pas récupérable ensuite.
    compose exec -T api npm run create:superadmin -- "$email"
  fi
}

# Les deux comptes d'administration d'un seul coup : la direction, qui
# distribue les rôles, et l'administrateur qui tient le contenu. `--yes` coupe
# les questions : `compose exec -T` n'a pas de terminal pour y répondre.
cmd_admins() {
  require_env
  local superadmin="${1:-}"
  local admin="${2:-}"
  [ -n "$superadmin" ] || die "Usage : $0 admins <email-superadmin> [email-admin]"

  step "Ouverture des comptes d'administration"
  if [ -n "$admin" ]; then
    compose exec -T api npm run bootstrap:admins -- --yes \
      --superadmin "$superadmin" --admin "$admin"
  else
    compose exec -T api npm run bootstrap:admins -- --yes --superadmin "$superadmin"
  fi
}

cmd_seed() {
  require_env
  step "Chargement du contenu de démonstration"
  compose exec -T api npm run seed
}

# Les outils mongo ne sont dans aucune image de la pile : on les emprunte à un
# conteneur jetable. L'URI passe par l'environnement et non par la ligne de
# commande, où elle serait lisible dans la liste des processus de l'hôte.
mongo_tool() {
  local uri
  if uses_local_db; then
    uri="mongodb://mongo:27017/$(env_value MONGO_DB || echo asc_camberene)"
    compose run --rm --no-deps -T -e MONGO_URI="$uri" --entrypoint sh mongo -c "$1"
  else
    uri="$(env_value MONGODB_URI)"
    docker run --rm -i -e MONGO_URI="$uri" --entrypoint sh mongo:7 -c "$1"
  fi
}

cmd_backup() {
  require_env
  mkdir -p "$BACKUP_DIR"
  local stamp; stamp="$(date +%Y%m%d-%H%M%S)"

  step "Sauvegarde de la base"
  mongo_tool 'mongodump --uri="$MONGO_URI" --archive --gzip' \
    > "$BACKUP_DIR/mongo-$stamp.archive.gz"

  step "Sauvegarde des images téléversées"
  # Elles ne sont pas dans la base : une base hébergée ne les sauvegarde pas.
  compose exec -T api tar czf - -C /app uploads > "$BACKUP_DIR/uploads-$stamp.tgz"

  green "✓ $BACKUP_DIR/mongo-$stamp.archive.gz"
  green "✓ $BACKUP_DIR/uploads-$stamp.tgz"
}

cmd_restore() {
  require_env
  local archive="${1:-}"
  [ -f "$archive" ] || die "Usage : $0 restore <fichier mongo-*.archive.gz>"

  local db; db="$(env_value MONGO_DB)"; db="${db:-asc_camberene}"

  red "Cette opération remplace le contenu actuel de la base."
  uses_local_db || red "La base visée est distante : $(env_value MONGODB_URI | sed -E 's|(//)[^@]*@|\1***@|')"
  read -r -p "Confirmer en tapant le nom de la base ($db) : " answer
  [ "$answer" = "$db" ] || die "Annulé"

  step "Restauration"
  mongo_tool 'mongorestore --uri="$MONGO_URI" --archive --gzip --drop' < "$archive"
  green "✓ Base restaurée"
}

# Blocage du site : un simple fichier dans le volume `etat`, que la règle de
# frontend/httpd-site.conf teste à chaque requête. Ni redémarrage ni
# reconstruction : l'effet est immédiat, et il survit aux redéploiements.
cmd_bloquer() {
  require_env_file
  step "Blocage du site"
  compose exec -T web touch /usr/local/apache2/etat/bloque
  green "✓ Site bloqué : les visiteurs voient « Ce site est inaccessible »"
}

cmd_debloquer() {
  require_env_file
  step "Déblocage du site"
  compose exec -T web rm -f /usr/local/apache2/etat/bloque
  green "✓ Site rétabli"
}

usage() {
  cat <<'USAGE'
Pilote de la pile Docker — ASC Cambérène

  up                      construit les images et démarre la pile
  down                    arrête la pile (base et images conservées)
  restart [service]       redémarre tout, ou un service
  deploy                  git pull, reconstruit, redémarre, vérifie
  status                  état des conteneurs
  logs [service]          journaux en continu
  shell [service]         ouvre un shell (api par défaut)
  superadmin <email> [mdp]  crée le premier compte d'administration
  admins <super> [admin]  ouvre les deux comptes d'administration d'un coup
  seed                    charge le contenu de démonstration
  backup                  sauvegarde base + images téléversées
  restore <archive>       restaure une sauvegarde de base
  bloquer                 affiche une fausse erreur DNS à la place du site
  debloquer               rétablit le site

Environnement lu dans .env.docker (voir .env.docker.example).
USAGE
}

case "${1:-}" in
  up)          shift; cmd_up "$@" ;;
  down)        shift; cmd_down ;;
  restart)     shift; cmd_restart "$@" ;;
  deploy)      shift; cmd_deploy "$@" ;;
  status)      shift; cmd_status ;;
  logs)        shift; cmd_logs "$@" ;;
  shell)       shift; cmd_shell "$@" ;;
  superadmin)  shift; cmd_superadmin "$@" ;;
  admins)      shift; cmd_admins "$@" ;;
  seed)        shift; cmd_seed ;;
  backup)      shift; cmd_backup ;;
  restore)     shift; cmd_restore "$@" ;;
  bloquer)     shift; cmd_bloquer ;;
  debloquer)   shift; cmd_debloquer ;;
  ""|-h|--help|help) usage ;;
  *) red "Commande inconnue : $1"; echo; usage; exit 1 ;;
esac

# Sortie explicite : sans elle, bash reprendrait sa lecture du fichier après ce
# bloc. Si le fichier a changé entre-temps, il y trouverait autre chose que ce
# qu'il avait commencé à lire.
exit $?
