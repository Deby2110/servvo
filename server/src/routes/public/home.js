import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/errors.js';
import { stripProductsInternal } from '../../lib/helpers.js';
import { getSettingsMap } from './settings.js';

const router = Router();

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' } },
};

function serialize(p) {
  const primary = (p.images || []).find((i) => i.isPrimary) || (p.images || [])[0] || null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    mediaType: p.mediaType,
    capacity: p.capacity,
    fireClass: p.fireClass,
    statusStok: p.statusStok,
    featured: p.featured,
    datasheetUrl: p.datasheetUrl,
    image: primary ? { url: primary.url, alt: primary.alt || p.name } : null,
    category: p.category,
  };
}

// GET /api/public/home
router.get(
  '/home',
  asyncHandler(async (_req, res) => {
    const [
      settings,
      featured,
      categories,
      testimonials,
      clients,
      banners,
      articles,
      gallery,
    ] = await Promise.all([
      getSettingsMap(),
      prisma.product.findMany({
        where: { status: 'PUBLISHED', deletedAt: null, featured: true },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: productInclude,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { _count: { select: { products: true } } },
      }),
      prisma.testimonial.findMany({ where: { isActive: true }, take: 6, orderBy: { sortOrder: 'asc' } }),
      prisma.client.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
      prisma.banner.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }] }),
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        take: 3,
        orderBy: { publishedAt: 'desc' },
        select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true },
      }),
      prisma.galleryItem.findMany({ take: 8, orderBy: { createdAt: 'desc' } }),
    ]);

    res.json({
      success: true,
      data: {
        settings,
        hero: {
          title: settings.heroTitle,
          subtitle: settings.heroSubtitle,
          image: settings.heroImage,
        },
        cta: { title: settings.ctaTitle, subtitle: settings.ctaSubtitle },
        featured: stripProductsInternal(featured).map(serialize),
        categories: categories.map((c) => ({
          id: c.id, name: c.name, slug: c.slug, icon: c.icon,
          description: c.description, productCount: c._count.products,
        })),
        testimonials,
        clients,
        banners,
        articles,
        gallery: gallery.map((g) => ({
          id: g.id, type: g.type, url: g.url, thumbnailUrl: g.thumbnailUrl || g.url,
          caption: g.caption, location: g.location,
        })),
      },
    });
  })
);

export default router;
