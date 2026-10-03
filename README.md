# jmg.github.io

Sitio personal de jmg: el portfolio es `index.html` — un solo archivo, sin build
ni dependencias — y la foto vive en `assets/`.

- GitHub Pages lo sirve tal cual.
- `Dockerfile` + `server.js` son la cáscara para correrlo como app en deploycloud.

## CV

`cv.html` es el CV (se lee en pantalla y se imprime a A4) y `cv.pdf` es lo que
bajan los botones de la home. El PDF sale de la página con el Chrome de la
máquina: después de tocar `cv.html`, correr `tools/cv-pdf.sh` y commitear los dos.
