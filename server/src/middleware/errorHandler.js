import { ApiError } from '../lib/errors.js';

export function notFound(_req, res) {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Multer
  if (err.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran file melebihi batas yang diizinkan.' : err.message;
    return res.status(400).json({ success: false, message: msg });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }
  if (err && err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Data duplikat: nilai unik sudah digunakan.',
    });
  }
  if (err && err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
  }
  // eslint-disable-next-line no-console
  console.error('[ERROR]', err);
  return res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
  });
}
