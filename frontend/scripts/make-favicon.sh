#!/usr/bin/env bash
#
# Régénère les favicons à partir du blason officiel.
#
#   ./scripts/make-favicon.sh
#
# Le blason source est public/assets/img/asc-camberene-logo-officiel.png : il
# sert aussi d'icône d'écran d'accueil iOS et de logo dans l'en-tête, donc le
# remplacer par une version haute définition améliore les trois d'un coup.
#
# Deux fichiers en sortie, et deux seulement :
#   favicon.svg  le blason encodé en ligne dans un carré — net à toute taille
#   favicon.png  le repli pour les navigateurs sans favicon vectoriel
#
# `sips` suffit : c'est l'outil d'image livré avec macOS, aucune dépendance à
# installer.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$ROOT/public/assets/img/asc-camberene-logo-officiel.png"

[ -f "$SOURCE" ] || { echo "✗ Blason introuvable : $SOURCE"; exit 1; }

echo "→ Source : $(sips -g pixelWidth -g pixelHeight "$SOURCE" | tail -2 | tr -d ' \n' | sed 's/pixelWidth:/ /;s/pixelHeight:/x/')"

echo "→ favicon.png"
sips -Z 180 "$SOURCE" --out "$ROOT/public/favicon.png" > /dev/null

# Le blason source peut faire plusieurs milliers de pixels de côté. Tel quel,
# il pèserait plus d'un mégaoctet une fois encodé dans le SVG — pour une image
# que le navigateur récupère à chaque chargement de page et n'affiche jamais
# au-delà de 180 pixels. On encode donc une réduction : 256 pixels couvrent
# l'onglet, la barre de favoris et les écrans à haute densité.
SMALL="$(mktemp -t favicon-source).png"
trap 'rm -f "$SMALL"' EXIT
sips -Z 256 "$SOURCE" --out "$SMALL" > /dev/null

echo "→ favicon.svg"
python3 - "$SMALL" "$ROOT/public/favicon.svg" <<'PY'
import base64, sys, pathlib, struct

source, target = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
raw = source.read_bytes()

# Dimensions lues dans l'entête IHDR du PNG, pour centrer sans les supposer.
width, height = struct.unpack('>II', raw[16:24])
side = max(width, height)
x, y = (side - width) / 2, (side - height) / 2

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {side} {side}" width="{side}" height="{side}">
  <!--
    Favicon : le blason officiel du club, centré dans un carré.

    L'image est encodée en ligne plutôt que référencée : un favicon est chargé
    avant le reste et ne doit dépendre d'aucune seconde requête. Le carré évite
    que le navigateur déforme un visuel en portrait.

    Fichier produit par scripts/make-favicon.sh — ne pas modifier à la main.
  -->
  <image x="{x:g}" y="{y:g}" width="{width}" height="{height}"
         preserveAspectRatio="xMidYMid meet"
         xlink:href="data:image/png;base64,{base64.b64encode(raw).decode()}"/>
</svg>
'''
target.write_text(svg, encoding='utf-8')
PY

echo "✓ Favicons régénérés"
