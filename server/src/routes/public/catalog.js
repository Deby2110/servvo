import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import {
  parsePageParams,
  stripProductsInternal,
  normalizeSpecifications,
  toBool,
} from '../../lib/helpers.js';
import { MEDIA_TYPE, FIRE_CLASS, SORT_OPTIONS } from '../../constants.js';

const router = Router();

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' } },
};

function serializeProduct(p) {
  const images = (p.images || []).map((img) => ({
    id: img.id,
    url: img.url,
    alt: img.alt || p.name,
    isPrimary: img.isPrimary,
  }));
  const primary = images.find((i) => i.isPrimary) || images[0] || null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    specifications: normalizeSpecifications(p.specifications),
    mediaType: p.mediaType,
    mediaTypeLabel: MEDIA_TYPE[p.mediaType] || p.mediaType,
    capacity: p.capacity,
    fireClass: p.fireClass,
    fireClassLabel: FIRE_CLASS[p.fireClass] || p.fireClass,
    statusStok: p.statusStok,
    statusStokLabel: p.statusStok,
    featured: p.featured,
    status: p.status,
    viewCount: p.viewCount,
    datasheetUrl: p.datasheetUrl,
    seoTitle: p.seoTitle,
    seoDesc: p.seoDesc,
    createdAt: p.createdAt,
    category: p.category,
    images,
    image: primary,
  };
}

// GET /api/public/categories
router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    res.json({
      success: true,
      data: {
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          icon: c.icon,
          productCount: c._count.products,
        })),
      },
    });
  })
);

// GET /api/public/products
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePageParams(req.query, { defaultLimit: 12 });
    const q = (req.query.q || '').toString().trim();
    const category = (req.query.category || '').toString().trim();
    const mediaType = (req.query.mediaType || '').toString().trim();
    const capacity = (req.query.capacity || '').toString().trim();
    const fireClass = (req.query.fireClass || '').toString().trim();
    const sort = SORT_OPTIONS.includes(req.query.sort) ? req.query.sort : 'terbaru';
    const featuredOnly = toBool(req.query.featured);

    const where = { status: 'PUBLISHED', deletedAt: null };
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { description: { contains: q } },
      ];
    }
    if (category) where.category = { slug: category };
    if (mediaType) where.mediaType = mediaType;
    if (capacity) where.capacity = capacity;
    if (fireClass) where.fireClass = fireClass;
    if (featuredOnly) where.featured = true;

    const orderBy =
      sort === 'nama'
        ? [{ name: 'asc' }]
        : sort === 'populer'
        ? [{ viewCount: 'desc' }]
        : [{ createdAt: 'desc' }];

    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, orderBy, skip, take: limit, include: productInclude }),
    ]);

    const products = stripProductsInternal(rows).map(serializeProduct);

    res.json({
      success: true,
      data: {
        products,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  })
);

// GET /api/public/products/filters -> opsi filter
router.get(
  '/products/filters',
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: { capacity: true, mediaType: true, fireClass: true },
    });
    const capacities = [...new Set(products.map((p) => p.capacity).filter(Boolean))].sort(
      (a, b) => parseFloat(a) - parseFloat(b)
    );
    const mediaTypes = [...new Set(products.map((p) => p.mediaType).filter(Boolean))];
    const fireClasses = [...new Set(products.map((p) => p.fireClass).filter(Boolean))];
    res.json({
      success: true,
      data: {
        capacities,
        mediaTypes,
        mediaTypeLabels: MEDIA_TYPE,
        fireClasses,
        fireClassLabels: FIRE_CLASS,
      },
    });
  })
);

// GET /api/public/products/:slug
router.get(
  '/products/:slug',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, deletedAt: null },
      include: productInclude,
    });
    if (!product) throw new ApiError(404, 'Produk tidak ditemukan.');
    if (product.status !== 'PUBLISHED') throw new ApiError(404, 'Produk belum tersedia.');

    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    const related = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        id: { not: product.id },
        categoryId: product.categoryId || undefined,
      },
      take: 4,
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        product: serializeProduct(product),
        related: stripProductsInternal(related).map(serializeProduct),
      },
    });
  })
);

export default router;
