import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import { uploadImage, uploadPdf, uploadDir } from '../../lib/upload.js';

const router = Router();

// GET /api/admin/media -> daftar file di folder uploads
router.get(
  '/media',
  asyncHandler(async (_req, res) => {
    const files = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          const stat = fs.statSync(full);
          const rel = path.relative(uploadDir, full).split(path.sep).join('/');
          files.push({
            name: entry.name,
            url: `/uploads/${rel}`,
            size: stat.size,
            modifiedAt: stat.mtime,
          });
        }
      }
    };
    try {
      walk(uploadDir);
    } catch {
      /* folder belum ada */
    }
    files.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    res.json({ success: true, data: { media: files, total: files.length } });
  })
);

// POST /api/admin/media -> unggah file umum (image/pdf)
router.post(
  '/media',
  (req, res, next) => {
    const kind = req.query.type === 'pdf' ? uploadPdf : uploadImage;
    kind.single('file')(req, res, (err) => (err ? next(err) : next()));
  },
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'Tidak ada file yang diunggah.');
    const rel = req.file.path.replace(/\\/g, '/').split('/uploads/')[1];
    res.status(201).json({ success: true, data: { url: `/uploads/${rel}` } });
  })
);

// DELETE /api/admin/media?url=/uploads/xxx
router.delete(
  '/media',
  asyncHandler(async (req, res) => {
    const url = (req.query.url || '').toString();
    if (!url.startsWith('/uploads/')) throw new ApiError(400, 'URL file tidak valid.');
    const filePath = path.resolve(process.cwd(), url.replace(/^\//, ''));
    const normalized = path.normalize(filePath);
    if (!normalized.startsWith(path.normalize(uploadDir))) {
      throw new ApiError(400, 'Path file di luar folder upload.');
    }
    await fs.promises.unlink(normalized).catch(() => {});
    res.json({ success: true, message: 'File dihapus.' });
  })
);

export default router;
