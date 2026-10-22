import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import { parsePageParams } from '../../lib/helpers.js';
import { INQUIRY_STATUS } from '../../constants.js';

const router = Router();

// GET /api/public/articles
router.get(
  '/articles',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePageParams(req.query, { defaultLimit: 9 });
    const where = { status: 'PUBLISHED' };
    const [total, rows] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true, title: true, slug: true, excerpt: true, coverImage: true,
          author: true, publishedAt: true, createdAt: true,
        },
      }),
    ]);
    res.json({
      success: true,
      data: { articles: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  })
);

// GET /api/public/articles/:slug
router.get(
  '/articles/:slug',
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!article || article.status !== 'PUBLISHED') throw new ApiError(404, 'Artikel tidak ditemukan.');
    const related = await prisma.article.findMany({
      where: { status: 'PUBLISHED', id: { not: article.id } },
      take: 3,
      orderBy: { publishedAt: 'desc' },
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true },
    });
    res.json({ success: true, data: { article, related } });
  })
);

// GET /api/public/pages/:slug
router.get(
  '/pages/:slug',
  asyncHandler(async (req, res) => {
    const page = await prisma.page.findUnique({ where: { slug: req.params.slug } });
    if (!page || page.status !== 'PUBLISHED') throw new ApiError(404, 'Halaman tidak ditemukan.');
    res.json({ success: true, data: { page } });
  })
);

// GET /api/public/faqs -> dari Setting faqItems (JSON)
router.get(
  '/faqs',
  asyncHandler(async (_req, res) => {
    const setting = await prisma.setting.findUnique({ where: { key: 'faqItems' } });
    let items = [];
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) items = parsed;
      } catch {
        items = [];
      }
    }
    res.json({ success: true, data: { faqs: items } });
  })
);

// GET /api/public/distribution
router.get(
  '/distribution',
  asyncHandler(async (_req, res) => {
    const areas = await prisma.distributionArea.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: { areas } });
  })
);

// GET /api/public/banners
router.get(
  '/banners',
  asyncHandler(async (_req, res) => {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: { banners } });
  })
);

// GET /api/public/testimonials
router.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: { testimonials } });
  })
);

// GET /api/public/clients
router.get(
  '/clients',
  asyncHandler(async (_req, res) => {
    const clients = await prisma.client.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    res.json({ success: true, data: { clients } });
  })
);

export { INQUIRY_STATUS };
export default router;
