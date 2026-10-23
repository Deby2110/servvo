import { Router } from 'express';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import { deleteUpload, listUploads, storeUpload } from '../../lib/objectStorage.js';
import { uploadImage, uploadPdf } from '../../lib/upload.js';

const router = Router();

// GET /api/admin/media -> daftar file di Neon Object Storage
router.get(
  '/media',
  asyncHandler(async (_req, res) => {
    const files = await listUploads();
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
    const url = await storeUpload(req.file, req.query.type === 'pdf' ? 'pdf/' : '');
    res.status(201).json({ success: true, data: { url } });
  })
);

// DELETE /api/admin/media?url=/uploads/xxx
router.delete(
  '/media',
  asyncHandler(async (req, res) => {
    const url = (req.query.url || '').toString();
    if (!url.startsWith('/uploads/')) throw new ApiError(400, 'URL file tidak valid.');
    await deleteUpload(url);
    res.json({ success: true, message: 'File dihapus.' });
  })
);

export default router;
