import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { MEDIA_TYPE, FIRE_CLASS } from '../../constants.js';

const router = Router();

// GET /api/public/calculator/rules
router.get(
  '/calculator/rules',
  asyncHandler(async (_req, res) => {
    const rules = await prisma.calculatorRule.findMany({
      orderBy: [{ sortOrder: 'asc' }, { buildingType: 'asc' }],
    });
    res.json({
      success: true,
      data: {
        rules: rules.map((r) => ({
          id: r.id,
          buildingType: r.buildingType,
          minArea: r.minArea,
          maxArea: r.maxArea,
          mediaType: r.mediaType,
          mediaTypeLabel: MEDIA_TYPE[r.mediaType] || r.mediaType,
          fireClass: r.fireClass,
          fireClassLabel: FIRE_CLASS[r.fireClass] || r.fireClass,
          unitPerArea: r.unitPerArea,
          minUnits: r.minUnits,
          notes: r.notes,
        })),
      },
    });
  })
);

const computeSchema = z.object({
  area: z.coerce.number().positive('Luas ruangan harus lebih dari 0.').max(1000000),
  buildingType: z.string().trim().min(1, 'Jenis bangunan wajib diisi.'),
});

// POST /api/public/calculator/compute
router.post(
  '/calculator/compute',
  validate(computeSchema),
  asyncHandler(async (req, res) => {
    const { area, buildingType } = req.body;
    const rules = await prisma.calculatorRule.findMany({ orderBy: { sortOrder: 'asc' } });

    const matches = (r) =>
      r.buildingType === buildingType &&
      area >= r.minArea &&
      (r.maxArea <= 0 || area <= r.maxArea);

    let selected = rules.filter(matches);
    if (selected.length === 0) {
      selected = rules.filter((r) => matches({ ...r, buildingType: 'UMUM' }) || r.buildingType === 'UMUM');
    }
    if (selected.length === 0) throw new ApiError(404, 'Aturan kalkulator tidak ditemukan untuk kombinasi ini.');

    const recommendations = selected.map((r) => {
      const raw = area * r.unitPerArea;
      const units = Math.max(r.minUnits, Math.ceil(raw));
      return {
        mediaType: r.mediaType,
        mediaTypeLabel: MEDIA_TYPE[r.mediaType] || r.mediaType,
        fireClass: r.fireClass,
        fireClassLabel: FIRE_CLASS[r.fireClass] || r.fireClass,
        units,
        coverageArea: area,
        notes: r.notes,
      };
    });

    res.json({
      success: true,
      data: {
        area,
        buildingType,
        recommendations,
        disclaimer:
          'Hasil bersifat estimasi awal. Kebutuhan riil sebaiknya dikonsultasikan dengan teknisi SERVVO NTT.',
      },
    });
  })
);

export default router;
