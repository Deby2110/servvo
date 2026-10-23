import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';

import { config } from './config.js';
import { getUpload } from './lib/objectStorage.js';
import { asyncHandler } from './lib/errors.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import publicRoutes from './routes/public/index.js';
import adminRoutes from './routes/admin/index.js';

const app = express();

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: [config.clientUrl],
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(morgan(config.isProd ? 'combined' : 'dev'));

// Uploaded files are stored in Neon Object Storage and streamed through the API.
app.get(
  '/uploads/*',
  asyncHandler(async (req, res) => {
    const key = req.params[0];
    const object = await getUpload(key);
    if (!object?.Body) {
      res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (object.ContentType) res.setHeader('Content-Type', object.ContentType);
    if (object.ContentLength != null) res.setHeader('Content-Length', object.ContentLength);
    await pipeline(object.Body, res);
  })
);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'SERVVO NTT API berjalan.', env: config.env });
});

// Rate limit untuk seluruh API
app.use('/api', apiLimiter);

app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// Sajikan build client (opsional) — dipakai saat produksi/Docker
const clientDist = path.resolve(process.cwd(), '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1d' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] API SERVVO NTT berjalan di http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
