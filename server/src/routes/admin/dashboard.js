import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/errors.js';

const router = Router();

// GET /api/admin/dashboard
router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      productTotal,
      productPublished,
      inquiryTotal,
      inquiryBaru,
      categoryTotal,
      articleTotal,
      galleryTotal,
      topProducts,
      recentInquiries,
      inquiries30,
    ] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: 'BARU' } }),
      prisma.category.count(),
      prisma.article.count(),
      prisma.galleryItem.count(),
      prisma.product.findMany({
        where: { deletedAt: null, status: 'PUBLISHED' },
        orderBy: { viewCount: 'desc' },
        take: 6,
        select: { id: true, name: true, slug: true, viewCount: true },
      }),
      prisma.inquiry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { _count: { select: { items: true } } },
      }),
      prisma.inquiry.findMany({
        where: { createdAt: { gte: since30 } },
        select: { createdAt: true },
      }),
    ]);

    // Agregasi klik penawaran per hari (30 hari)
    const byDay = new Map();
    for (const i of inquiries30) {
      const key = i.createdAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }
    const clicks = [];
    for (let d = 29; d >= 0; d -= 1) {
      const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      const key = date.toISOString().slice(0, 10);
      clicks.push({ date: key, label: key.slice(5), count: byDay.get(key) || 0 });
    }

    res.json({
      success: true,
      data: {
        counts: {
          products: productTotal,
          published: productPublished,
          inquiries: inquiryTotal,
          newInquiries: inquiryBaru,
          categories: categoryTotal,
          articles: articleTotal,
          gallery: galleryTotal,
        },
        topProducts,
        recentInquiries,
        clicks,
      },
    });
  })
);

export default router;
