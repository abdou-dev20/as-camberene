# ==========================================================================
# Site ASC Cambérène — construction puis service
# ==========================================================================
# Le site est construit dans une image jetable qui embarque Node, et seul le
# résultat — des fichiers statiques — part dans l'image finale. L'hôte n'a donc
# besoin ni de Node ni de npm.
#
# Le contexte de construction est le dossier frontend/ lui-même (voir
# docker-compose.yml) ; sur Coolify : Base Directory = /frontend.

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

# L'adresse de l'API est figée à la construction : Vite l'inscrit dans le
# bundle, elle ne peut pas être changée au démarrage du conteneur.
#
# Sans argument, c'est .env.production qui décide. Un argument passé vide
# l'écraserait quand même — Vite fait passer l'environnement avant les fichiers
# .env — et le site appellerait alors http://localhost:4100 : les variables
# vides sont donc retirées avant la construction.
ARG VITE_SITE_API_URL
ARG VITE_API_URL
ARG VITE_CLUB_ID

COPY . ./
RUN for v in VITE_SITE_API_URL VITE_API_URL VITE_CLUB_ID; do \
      [ -n "$(printenv "$v")" ] || unset "$v"; \
    done \
 && npm run build

# --------------------------------------------------------------------------
FROM httpd:2.4-alpine AS runtime

# L'image de base livre ces modules mais les laisse commentés.
RUN sed -i \
    -e 's|^#\(LoadModule proxy_module .*\)|\1|' \
    -e 's|^#\(LoadModule proxy_http_module .*\)|\1|' \
    -e 's|^#\(LoadModule rewrite_module .*\)|\1|' \
    -e 's|^#\(LoadModule headers_module .*\)|\1|' \
    -e 's|^#\(LoadModule deflate_module .*\)|\1|' \
    conf/httpd.conf \
 && echo 'Include conf/extra/asc-site.conf' >> conf/httpd.conf

COPY httpd-site.conf conf/extra/asc-site.conf
COPY --from=build /app/dist ./htdocs

# Les fichiers de `public/` sont copiés tels quels par Vite, avec les droits
# qu'ils ont sur la machine qui construit. Un umask restrictif les rendrait
# illisibles pour `www-data`, et Apache répondrait 403 sur les images sans
# rien dire d'utile. On repart donc de droits explicites.
RUN chmod -R a+rX htdocs

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
