#!/bin/sh
# Regenera cv.pdf a partir de cv.html con el Chrome de la máquina — sin
# dependencias ni build. Correrlo después de tocar cv.html y commitear los dos.
#
# El presupuesto de tiempo virtual es para que lleguen las fuentes de Google
# antes de imprimir: sin él, el PDF puede salir con la tipografía de sistema.
set -eu
cd "$(dirname "$0")/.."
CHROME="${CHROME:-google-chrome}"
"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=10000 --run-all-compositor-stages-before-draw \
  --print-to-pdf=cv.pdf "file://$PWD/cv.html" 2>/dev/null
pages=$(pdfinfo cv.pdf 2>/dev/null | awk '/^Pages:/{print $2}' || true)
echo "cv.pdf listo${pages:+ ($pages páginas)}"
