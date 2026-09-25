import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3321;
const HOST = process.env.HOST || '0.0.0.0';
const DIST_PATH = path.join(__dirname, 'dist');
const INDEX_HTML = path.join(DIST_PATH, 'index.html');

// Basic security and performance headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check endpoint for Hostinger VPS, Docker, PM2 and Uptime monitoring
app.get(['/health', '/api/health'], (req, res) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    status: 'ok',
    service: 'gestione-operatori-cantieri',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    node: process.version,
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
    },
  });
});

// Serve hashed static assets with 1 year immutable cache
app.use(
  '/assets',
  express.static(path.join(DIST_PATH, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

// Serve other static files (favicon, robots, manifest, etc.)
app.use(
  express.static(DIST_PATH, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      // Never cache index.html so updates are immediate
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  })
);

// Single Page Application (SPA) fallback
app.get('*', (req, res) => {
  if (fs.existsSync(INDEX_HTML)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(INDEX_HTML);
  } else {
    res.status(404).send('Build not found. Please run "npm run build" first.');
  }
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log('----------------------------------------------------');
  console.log(`🚀 Production server running on http://${HOST}:${PORT}`);
  console.log(`📁 Serving directory: ${DIST_PATH}`);
  console.log(`🩺 Health check: http://${HOST}:${PORT}/health`);
  console.log(`⚙️  Node environment: ${process.env.NODE_ENV || 'production'}`);
  console.log('----------------------------------------------------');
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
  // Force exit if hanging
  setTimeout(() => {
    console.error('Force shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
