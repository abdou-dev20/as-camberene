# ==========================================================================
# API du site ASC Cambérène
# ==========================================================================
# Construction en deux temps : TypeScript est compilé dans une image jetable,
# et seul le résultat part dans l'image finale.

FROM node:20-alpine AS build
WORKDIR /app

# Les dépendances sont copiées seules d'abord : tant que package-lock.json ne
# change pas, Docker réutilise cette couche et l'installation est instantanée.
COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src
# Seule l'API est compilée ici : les scripts d'administration tournent dans
# l'image finale via `tsx`, qui lit directement leurs sources.
RUN npm run build:api

# --------------------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# `--include=dev` est nécessaire malgré NODE_ENV=production, qui ferait
# autrement sauter les dépendances de développement : `tsx` fait tourner les
# scripts d'administration — création du super administrateur, jeu de
# démonstration — et ils s'exécutent dans ce conteneur.
COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY tsconfig*.json ./

# Les scripts d'administration et les sources qu'ils importent : `tsx` compile
# à la volée, il lui faut le TypeScript et non le JavaScript déjà construit.
# Quelques centaines de kilo-octets, pour que la création de comptes et le jeu
# de démonstration s'exécutent dans le conteneur.
COPY scripts ./scripts
COPY src ./src

# Le dossier des images téléversées est un volume : il doit appartenir à
# l'utilisateur qui écrit dedans.
RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 4100

# Le conteneur se déclare sain quand l'API répond réellement, pas quand le
# processus a démarré : `depends_on` peut alors attendre le bon moment.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:4100/health > /dev/null || exit 1

CMD ["node", "dist/index.js"]
