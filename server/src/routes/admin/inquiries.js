import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { parsePageParams } from '../../lib/helpers.js';
import { INQUIRY_STATUS_LIST, INQUIRY_STATUS } from '../../constants.js';

const router = Router();

// GET /api/admin/inquiries
router.get(
  '/inquiries',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePageParams(req.query, { defaultLimit: 15, maxLimit: 100 });
    const status = (req.query.status || '').toString().trim();
    const q = (req.query.q || '').toString().trim();
    const where = {};
    if (status) where.status = status;
    if (q) where.OR = [{ code: { contains: q } }, { name: { contains: q } }, { city: { contains: q } }];

    const [total, rows] = await Promise.all([
      prisma.inquiry.count({ where }),
      prisma.inquiry.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
        include: { _count: { select: { items: true } } },
      }),
    ]);
    res.json({
      success: true,
      data: {
        inquiries: rows.map((r) => ({ ...r, itemCount: r._count.items })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        statuses: INQUIRY_STATUS_LIST,
      },
    });
  })
);

// GET /api/admin/inquiries/:id
router.get(
  '/inquiries/:id',
  asyncHandler(async (req, res) => {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!inquiry) throw new ApiError(404, 'Inquiry tidak ditemukan.');
    res.json({ success: true, data: { inquiry } });
  })
);

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(INQUIRY_STATUS_LIST).optional(),
  internalNote: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

// PUT /api/admin/inquiries
router.put(
  '/inquiries',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Inquiry tidak ditemukan.');
    const updated = await prisma.inquiry.update({ where: { id }, data });
    res.json({ success: true, data: { inquiry: updated } });
  })
);

// DELETE /api/admin/inquiries/:id
router.delete(
  '/inquiries/:id',
  asyncHandler(async (req, res) => {
    await prisma.inquiry.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Inquiry dihapus.' });
  })
);

// GET /api/admin/inquiries/export/csv?status=
router.get(
  '/inquiries/export/csv',
  asyncHandler(async (req, res) => {
    const status = (req.query.status || '').toString().trim();
    const where = status ? { status } : {};
    const rows = await prisma.inquiry.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: { items: true },
    });

    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['Kode', 'Tanggal', 'Nama', 'Kota', 'WhatsApp', 'Email', 'Status', 'Catatan', 'Item'].join(','),
    ];
    for (const r of rows) {
      const items = r.items
        .map((i) => `${i.productName} x${i.qty}${i.note ? ` (${i.note})` : ''}`)
        .join('; ');
      lines.push(
        [
          esc(r.code),
          esc(new Date(r.createdAt).toLocaleString('id-ID')),
          esc(r.name),
          esc(r.city),
          esc(r.whatsapp),
          esc(r.email),
          esc(INQUIRY_STATUS[r.status] || r.status),
          esc(r.notes),
          esc(items),
        ].join(',')
      );
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="inquiries.csv"');
    res.send('﻿' + lines.join('\n'));
  })
);

export default router;
