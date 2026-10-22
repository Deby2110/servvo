import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { uniqueSlug } from '../../lib/slug.js';
import { uploadImage } from '../../lib/upload.js';
import { GALLERY_TYPE } from '../../constants.js';

const router = Router();

const albumSchema = z.object({
  title: z.string().trim().min(1, 'Judul album wajib diisi.').max(160),
  description: z.string().optional().default(''),
  coverImage: z.string().optional().default(''),
  sortOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});
const albumUpdate = albumSchema.extend({ id: z.string().min(1) });

function removeLocalFile(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const filePath = path.resolve(process.cwd(), url.replace(/^\//, ''));
  fs.promises.unlink(filePath).catch(() => {});
}

// GET /api/admin/gallery/albums
router.get(
  '/gallery/albums',
  asyncHandler(async (_req, res) => {
    const albums = await prisma.album.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { items: true } } },
    });
    res.json({
      success: true,
      data: {
        albums: albums.map((a) => ({ ...a, itemCount: a._count.items })),
      },
    });
  })
);

// POST /api/admin/gallery/albums
router.post(
  '/gallery/albums',
  validate(albumSchema),
  asyncHandler(async (req, res) => {
    const slug = await uniqueSlug(prisma.album, req.body.title);
    const created = await prisma.album.create({ data: { ...req.body, slug } });
    res.status(201).json({ success: true, data: { album: created } });
  })
);

// PUT /api/admin/gallery/albums
router.put(
  '/gallery/albums',
  validate(albumUpdate),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const existing = await prisma.album.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Album tidak ditemukan.');
    const slug =
      data.title && data.title !== existing.title
        ? await uniqueSlug(prisma.album, data.title, { excludeId: id })
        : existing.slug;
    const updated = await prisma.album.update({ where: { id }, data: { ...data, slug } });
    res.json({ success: true, data: { album: updated } });
  })
);

// DELETE /api/admin/gallery/albums/:id
router.delete(
  '/gallery/albums/:id',
  asyncHandler(async (req, res) => {
    const album = await prisma.album.findUnique({ where: { id: req.params.id } });
    if (!album) throw new ApiError(404, 'Album tidak ditemukan.');
    const items = await prisma.galleryItem.findMany({
      where: { albumId: album.id },
      select: { url: true, thumbnailUrl: true },
    });
    await prisma.album.delete({ where: { id: album.id } });
    items.forEach((it) => {
      removeLocalFile(it.url);
      removeLocalFile(it.thumbnailUrl);
    });
    res.json({ success: true, message: 'Album dan seluruh isinya dihapus.' });
  })
);

// GET /api/admin/gallery/albums/:id/items
router.get(
  '/gallery/albums/:id/items',
  asyncHandler(async (req, res) => {
    const items = await prisma.galleryItem.findMany({
      where: { albumId: req.params.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: { items } });
  })
);

const itemSchema = z.object({
  albumId: z.string().min(1, 'Album wajib dipilih.'),
  type: z.enum(GALLERY_TYPE).optional().default('IMAGE'),
  url: z.string().optional().default(''),
  thumbnailUrl: z.string().optional().default(''),
  caption: z.string().optional().default(''),
  location: z.string().optional().default(''),
  takenAt: z.string().optional().default(''),
  sortOrder: z.coerce.number().int().optional().default(0),
});
const itemUpdate = itemSchema.extend({ id: z.string().min(1) });

// POST /api/admin/gallery/items
router.post(
  '/gallery/items',
  validate(itemSchema),
  asyncHandler(async (req, res) => {
    const created = await prisma.galleryItem.create({ data: req.body });
    res.status(201).json({ success: true, data: { item: created } });
  })
);

// POST /api/admin/gallery/albums/:id/items/upload (unggah massal)
router.post(
  '/gallery/albums/:id/items/upload',
  uploadImage.array('images', 20),
  asyncHandler(async (req, res) => {
    const album = await prisma.album.findUnique({ where: { id: req.params.id } });
    if (!album) throw new ApiError(404, 'Album tidak ditemukan.');
    const files = req.files || [];
    if (!files.length) throw new ApiError(400, 'Tidak ada file yang diunggah.');
    const count = await prisma.galleryItem.count({ where: { albumId: album.id } });
    const created = await prisma.$transaction(
      files.map((file, i) =>
        prisma.galleryItem.create({
          data: {
            albumId: album.id,
            type: 'IMAGE',
            url: `/uploads/${file.filename}`,
            thumbnailUrl: `/uploads/${file.filename}`,
            caption: req.body?.caption || path.basename(file.originalname, path.extname(file.originalname)),
            location: req.body?.location || '',
            takenAt: req.body?.takenAt || '',
            sortOrder: count + i,
          },
        })
      )
    );
    res.status(201).json({ success: true, data: { items: created } });
  })
);

// PUT /api/admin/gallery/items
router.put(
  '/gallery/items',
  validate(itemUpdate),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const existing = await prisma.galleryItem.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Item galeri tidak ditemukan.');
    const updated = await prisma.galleryItem.update({ where: { id }, data });
    res.json({ success: true, data: { item: updated } });
  })
);

// PUT /api/admin/gallery/albums/:id/items/reorder
router.put(
  '/gallery/albums/:id/items/reorder',
  validate(
    z.object({
      ids: z.array(z.string()).min(1),
    })
  ),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    await prisma.$transaction(
      ids.map((itemId, index) =>
        prisma.galleryItem.update({ where: { id: itemId }, data: { sortOrder: index } })
      )
    );
    res.json({ success: true, message: 'Urutan diperbarui.' });
  })
);

// DELETE /api/admin/gallery/items/:id
router.delete(
  '/gallery/items/:id',
  asyncHandler(async (req, res) => {
    const item = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
    if (!item) throw new ApiError(404, 'Item galeri tidak ditemukan.');
    await prisma.galleryItem.delete({ where: { id: item.id } });
    removeLocalFile(item.url);
    removeLocalFile(item.thumbnailUrl);
    res.json({ success: true, message: 'Item galeri dihapus.' });
  })
);

export default router;
