#!/usr/bin/env bash
#
# Mise à jour du site en production.
#
#   sudo -u www-data /var/www/as-camberene/deploy/deploy.sh
#
# Le script s'arrête à la première erreur : mieux vaut un site inchangé qu'un
# site à moitié déployé. Le redémarrage du service n'a lieu que si tout ce qui
# précède a réussi.

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/as-camberene}"
SERVICE="${SERVICE:-asc-camberene-api}"

cd "$APP_DIR"

echo "→ Récupération des sources"
# `--ff-only` : un déploiement ne résout pas de conflit. Si l'avance rapide est
# impossible, c'est qu'il y a des modifications locales à examiner d'abord.
git pull --ff-only

echo "→ Dépendances et construction du site"
cd frontend
npm ci
npm run build
cd ..

echo "→ Dépendances et construction de l'API"
cd backend
# Les dépendances de développement restent installées : `tsc` construit, et
# `tsx` fait tourner les scripts d'administration (création de comptes, seed).
npm ci
npm run build
cd ..

echo "→ Redémarrage de l'API"
sudo systemctl restart "$SERVICE"

# Le service peut démarrer puis mourir sur une variable manquante : on laisse
# passer quelques secondes avant de conclure.
sleep 3
if ! systemctl is-active --quiet "$SERVICE"; then
  echo "✗ L'API n'a pas démarré. Journal :"
  journalctl -u "$SERVICE" -n 30 --no-pager
  exit 1
fi

echo "→ Vérification"
curl -fsS http://127.0.0.1:4100/health > /dev/null && echo "  API : OK"
curl -fsS -o /dev/null https://ascamberene.sn/ && echo "  Site : OK"

echo "✓ Déploiement terminé"
