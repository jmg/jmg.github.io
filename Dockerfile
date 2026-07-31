# El sitio es HTML estático, así que la imagen es el repo + un servidor Node de
# ~100 líneas sin dependencias. Se copia el repo entero a propósito: cualquier
# archivo que se agregue después se sirve solo, sin tocar este Dockerfile.
FROM node:22-alpine
WORKDIR /app
COPY . ./site
# Todo lo que queda en site/ es público — la plomería del deploy va afuera.
RUN mv site/server.js . && rm -f site/Dockerfile site/deploycloud.toml site/.dockerignore
EXPOSE 3000
CMD ["node", "server.js"]
