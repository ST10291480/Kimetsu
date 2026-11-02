const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname);
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || '0.0.0.0';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};
const apiRequests = new Map();

const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }

  let requestUrl;
  try {
    requestUrl = new URL(req.url, 'http://localhost');
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (requestUrl.pathname === '/api/anidb') {
    const now = Date.now();
    const clientIp = req.socket.remoteAddress || 'unknown';
    const recent = (apiRequests.get(clientIp) || []).filter(time => now - time < 60_000);
    if (recent.length >= 60) {
      res.writeHead(429, { 'Retry-After': '60' }).end('Too many AniDB requests');
      return;
    }

    const request = requestUrl.searchParams.get('request');
    const client = requestUrl.searchParams.get('client') || '';
    const aid = requestUrl.searchParams.get('aid');
    if (!['anime', 'hotanime'].includes(request) || !/^[^\u0000-\u001f\u007f]{1,50}$/.test(client) || (aid && !/^\d{1,10}$/.test(aid)) || (request === 'anime' && !aid)) {
      res.writeHead(400).end('Invalid AniDB request');
      return;
    }

    recent.push(now);
    apiRequests.set(clientIp, recent);
    if (apiRequests.size > 5000) {
      for (const [ip, timestamps] of apiRequests) if (!timestamps.some(time => now - time < 60_000)) apiRequests.delete(ip);
    }

    const upstreamUrl = new URL('http://api.anidb.net:9001/httpapi');
    upstreamUrl.searchParams.set('request', request);
    upstreamUrl.searchParams.set('client', client);
    upstreamUrl.searchParams.set('clientver', '1');
    upstreamUrl.searchParams.set('protover', '1');
    if (aid) upstreamUrl.searchParams.set('aid', aid);
    fetch(upstreamUrl, { signal: AbortSignal.timeout(8000) }).then(async upstream => {
      const body = await upstream.text();
      res.writeHead(upstream.status, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(body);
    }).catch(() => {
      if (!res.headersSent) res.writeHead(502).end('AniDB is temporarily unavailable');
    });
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.some(segment => segment.startsWith('.'))) {
    res.writeHead(404).end('Not found');
    return;
  }

  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 500).end('Not found');
      return;
    }

    const ext = path.extname(file).toLowerCase();
    res.setHeader('Cache-Control', ext === '.html' || ext === '.webmanifest' || path.basename(file) === 'sw.js'
      ? 'no-cache'
      : 'public, max-age=3600');
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

server.listen(port, host, () => {
  console.log(`Kitsu server ready at http://localhost:${port}`);
});
