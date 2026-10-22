import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { DEFAULT_SETTINGS } from '../../constants.js';

const router = Router();

// Key pengaturan yang disembunyikan dari form admin (nonaktif sementara).
// Data tetap tersimpan di DB & API publik. Hapus dari daftar ini untuk menampilkan lagi field-nya.
const HIDDEN_SETTING_KEYS = ['certificateTitle', 'certificates'];

// GET /api/admin/settings
router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { label: 'asc' }] });
    const map = {};
    for (const s of DEFAULT_SETTINGS) map[s.key] = { ...s, value: s.value };
    for (const r of rows) map[r.key] = { ...map[r.key], ...r };
    const items = Object.values(map).filter((i) => !HIDDEN_SETTING_KEYS.includes(i.key));
    res.json({ success: true, data: { settings: items, groups: [...new Set(items.map((i) => i.group))] } });
  })
);

const updateSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string().optional().default(''),
      label: z.string().optional(),
      group: z.string().optional(),
      type: z.string().optional(),
    })
  ),
});

// PUT /api/admin/settings -> upsert massal
router.put(
  '/settings',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { settings } = req.body;
    await prisma.$transaction(
      settings.map((s) =>
        prisma.setting.upsert({
          where: { key: s.key },
          create: { key: s.key, value: s.value || '', group: s.group || 'umum', type: s.type || 'TEXT', label: s.label || s.key },
          update: { value: s.value ?? '' },
        })
      )
    );
    res.json({ success: true, message: 'Pengaturan disimpan.' });
  })
);

// GET /api/admin/users -> hanya admin (perkembangan role berikutnya)
router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: { users: rows } });
  })
);

export default router;
