import multer from 'multer';
import path from 'node:path';
import { config } from '../config.js';
import { ApiError } from './errors.js';

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const PDF_EXT = ['.pdf'];

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isImage = IMAGE_EXT.includes(ext);
  const isPdf = PDF_EXT.includes(ext);
  if (isImage || isPdf) return cb(null, true);
  return cb(new ApiError(400, `Format file tidak didukung: ${ext}. Gunakan JPG/PNG/WebP/PDF.`));
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.uploadMaxImageMb * 1024 * 1024 },
});

export const uploadPdf = multer({
  storage,
  fileFilter: (req, file, cb) =>
    PDF_EXT.includes(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new ApiError(400, 'Hanya file PDF yang diizinkan.')),
  limits: { fileSize: config.uploadMaxPdfMb * 1024 * 1024 },
});
