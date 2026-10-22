import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { config } from '../config.js';
import { ApiError } from './errors.js';

const uploadDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const PDF_EXT = ['.pdf'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

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
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadDir, 'pdf')),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  fileFilter: (req, file, cb) =>
    PDF_EXT.includes(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new ApiError(400, 'Hanya file PDF yang diizinkan.')),
  limits: { fileSize: config.uploadMaxPdfMb * 1024 * 1024 },
});

export { uploadDir };
