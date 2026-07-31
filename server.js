/* Servidor estático del sitio — sin dependencias ni build. Sirve los archivos
   de ./site (el repo tal cual, igual que GitHub Pages) en $PORT, que es lo que
   inyecta deploycloud. GitHub Pages sigue funcionando como siempre: esto es
   solo la cáscara para poder correrlo como app. */
const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve(__dirname, process.env.SITE_DIR || 'site');
/* La landing linkea a /viajes/, que vive en otro repo y se publica en GitHub
   Pages — redirigimos para que el botón siga andando en cualquier dominio. */
const VIAJES_URL = process.env.VIAJES_URL || 'https://jmg.github.io/viajes/';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/* Resuelve la URL a un archivo dentro de ROOT, o null si se escapa del root
   (../ codificado incluido) o si no existe. */
async function resolveFile(urlPath) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath);
  } catch {
    return null; // %-encoding roto
  }
  let file = path.resolve(ROOT, `.${path.posix.normalize(rel)}`);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return null;
  try {
    const st = await fsp.stat(file);
    if (st.isDirectory()) {
      file = path.join(file, 'index.html');
      return { file, stat: await fsp.stat(file) };
    }
    return { file, stat: st };
  } catch {
    return null;
  }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method not allowed');

  const urlPath = new URL(req.url, 'http://localhost').pathname;

  // Health check del deploy: responde antes de tocar el disco.
  if (urlPath === '/healthz') return send(res, 200, 'ok', { 'cache-control': 'no-store' });

  if (urlPath === '/viajes' || urlPath.startsWith('/viajes/')) {
    return send(res, 302, '', { location: VIAJES_URL, 'cache-control': 'no-store' });
  }

  const hit = await resolveFile(urlPath);
  if (!hit) {
    // Ruta sin extensión (un enlace, no un asset) → la landing; el resto, 404.
    if (path.extname(urlPath)) return send(res, 404, 'not found');
    const index = path.join(ROOT, 'index.html');
    return serve(req, res, index, await fsp.stat(index), 200);
  }
  return serve(req, res, hit.file, hit.stat, 200);
});

function serve(req, res, file, stat, status) {
  const ext = path.extname(file).toLowerCase();
  const etag = `W/"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
  const headers = {
    'content-type': TYPES[ext] || 'application/octet-stream',
    'content-length': stat.size,
    etag,
    'last-modified': stat.mtime.toUTCString(),
    // El HTML se revalida siempre; los assets no llevan hash, así que una hora.
    'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  };

  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { etag, 'cache-control': headers['cache-control'] });
    return res.end();
  }

  res.writeHead(status, headers);
  if (req.method === 'HEAD') return res.end();

  const stream = fs.createReadStream(file);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}

server.listen(PORT, () => console.log(`sitio en :${PORT} (root ${ROOT})`));
