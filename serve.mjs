#!/usr/bin/env node
/* Servidor local para ver dist/ mientras trabajas: node serve.mjs */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const dir = new URL('./dist/', import.meta.url).pathname;
const port = Number(process.env.PORT || 4321);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
};

createServer(async (req, res) => {
  let path = join(dir, decodeURIComponent(req.url.split('?')[0]));
  try {
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
  } catch {
    path = join(dir, '404.html');
    res.statusCode = 404;
  }
  try {
    const body = await readFile(path);
    res.setHeader('content-type', types[extname(path)] || 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('404');
  }
}).listen(port, () => console.log(`http://localhost:${port}/`));
