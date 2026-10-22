import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { config } from '../../config.js';

const router = Router();

const itemSchema = z.object({
  productId: z.string().optional().nullable(),
  productName: z.string().min(1, 'Nama produk wajib diisi.'),
  productSlug: z.string().optional().default(''),
  qty: z.coerce.number().int().positive().default(1),
  note: z.string().optional().default(''),
});

const inquirySchema = z.object({
  name: z.string().optional().default('').or(z.literal('')),
  city: z.string().optional().default('').or(z.literal('')),
  whatsapp: z.string().optional().default('').or(z.literal('')),
  email: z.string().email('Format email tidak valid.').optional().or(z.literal('')).or(z.null()),
  notes: z.string().optional().default('').or(z.literal('')),
  items: z.array(itemSchema).min(1, 'Minimal satu produk dalam penawaran.'),
});

// POST /api/public/inquiries
router.post(
  '/inquiries',
  validate(inquirySchema),
  asyncHandler(async (req, res) => {
    if (!config.inquiryEnabled) {
      throw new ApiError(403, 'Fitur penawaran sedang dinonaktifkan.');
    }
    const { name, city, whatsapp, email, notes, items } = req.body;

    // resolve productId agar relasi tetap valid
    const productIds = items.map((i) => i.productId).filter(Boolean);
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const byId = Object.fromEntries(products.map((p) => [p.id, p]));

    const count = await prisma.inquiry.count();
    const code = `INQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const inquiry = await prisma.inquiry.create({
      data: {
        code,
        name,
        city,
        whatsapp,
        email: email || '',
        notes,
        items: {
          create: items.map((i) => ({
            productId: i.productId || null,
            productName: byId[i.productId]?.name || i.productName,
            productSlug: byId[i.productId]?.slug || i.productSlug || '',
            qty: i.qty,
            note: i.note || '',
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json({
      success: true,
      message: 'Permintaan penawaran berhasil dikirim.',
      data: { inquiry: { code: inquiry.code, status: inquiry.status } },
    });
  })
);

export default router;
