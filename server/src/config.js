import dotenv from 'dotenv';

dotenv.config();

const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: toInt(process.env.PORT, 5000),
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTtlDays: toInt(process.env.REFRESH_TOKEN_TTL_DAYS, 30),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@servvo-ntt.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin12345',
  adminName: process.env.ADMIN_NAME || 'Administrator SERVVO NTT',
  inquiryEnabled: String(process.env.INQUIRY_ENABLED || 'true').toLowerCase() !== 'false',
  whatsappNumber: process.env.WHATSAPP_NUMBER || '6281234567890',
  uploadMaxImageMb: toInt(process.env.UPLOAD_MAX_IMAGE_MB, 5),
  uploadMaxPdfMb: toInt(process.env.UPLOAD_MAX_PDF_MB, 10),
  uploadDir: new URL('../uploads/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
};
