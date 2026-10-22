import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { uniqueSlug } from '../../lib/slug.js';

const router = Router();

const schema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi.').max(120),
  description: z.string().optional().default(''),
  icon: z.string().optional().default(''),
  sortOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const updateSchema = schema.extend({ id: z.string().min(1) });

// GET /api/admin/categories
router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    res.json({
      success: true,
      data: {
        categories: rows.map((c) => ({ ...c, productCount: c._count.products })),
      },
    });
  })
);

// POST /api/admin/categories
router.post(
  '/categories',
  validate(schema),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const slug = await uniqueSlug(prisma.category, data.name);
    const created = await prisma.category.create({ data: { ...data, slug } });
    res.status(201).json({ success: true, data: { category: created } });
  })
);

// PUT /api/admin/categories
router.put(
  '/categories',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Kategori tidak ditemukan.');
    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = await uniqueSlug(prisma.category, data.name, { excludeId: id });
    }
    const updated = await prisma.category.update({ where: { id }, data: { ...data, slug } });
    res.json({ success: true, data: { category: updated } });
  })
);

// DELETE /api/admin/categories/:id
router.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const count = await prisma.product.count({ where: { categoryId: id, deletedAt: null } });
    if (count > 0) {
      throw new ApiError(409, `Kategori masih dipakai ${count} produk. Pindahkan produk terlebih dahulu.`);
    }
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Kategori dihapus.' });
  })
);

export default router;
