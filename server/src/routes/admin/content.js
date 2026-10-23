import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { uniqueSlug } from '../../lib/slug.js';
import { sanitizeHtml } from '../../lib/sanitize.js';
import { parsePageParams } from '../../lib/helpers.js';
import { uploadImage } from '../../lib/upload.js';
import { deleteUpload, storeUpload } from '../../lib/objectStorage.js';
import { PAGE_STATUS, AREA_TYPE } from '../../constants.js';

const router = Router();

// ============================ ARTIKEL ============================
const articleSchema = z.object({
  title: z.string().trim().min(1, 'Judul artikel wajib diisi.').max(200),
  excerpt: z.string().optional().default(''),
  content: z.string().optional().default(''),
  coverImage: z.string().optional().default(''),
  author: z.string().optional().default('Admin SERVVO'),
  status: z.enum(PAGE_STATUS).optional().default('DRAFT'),
  publishedAt: z.string().optional().nullable(),
});
const articleUpdate = articleSchema.extend({ id: z.string().min(1) });

router.get(
  '/articles',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePageParams(req.query, { defaultLimit: 15, maxLimit: 100 });
    const q = (req.query.q || '').toString().trim();
    const status = (req.query.status || '').toString().trim();
    const where = {};
    if (q) where.title = { contains: q };
    if (status) where.status = status;
    const [total, rows] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);
    res.json({
      success: true,
      data: {
        articles: rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  })
);

router.get(
  '/articles/:id',
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!article) throw new ApiError(404, 'Artikel tidak ditemukan.');
    res.json({ success: true, data: { article } });
  })
);

router.post(
  '/articles',
  validate(articleSchema),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const slug = await uniqueSlug(prisma.article, data.title);
    const created = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt || '',
        content: sanitizeHtml(data.content || ''),
        coverImage: data.coverImage || '',
        author: data.author || 'Admin SERVVO',
        status: data.status,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      },
    });
    res.status(201).json({ success: true, data: { article: created } });
  })
);

router.put(
  '/articles',
  validate(articleUpdate),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Artikel tidak ditemukan.');
    const slug =
      data.title && data.title !== existing.title
        ? await uniqueSlug(prisma.article, data.title, { excludeId: id })
        : existing.slug;
    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt || '',
        content: sanitizeHtml(data.content || ''),
        coverImage: data.coverImage || '',
        author: data.author || 'Admin SERVVO',
        status: data.status,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      },
    });
    res.json({ success: true, data: { article: updated } });
  })
);

router.delete(
  '/articles/:id',
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!article) throw new ApiError(404, 'Artikel tidak ditemukan.');
    await prisma.article.delete({ where: { id: article.id } });
    await deleteUpload(article.coverImage);
    res.json({ success: true, message: 'Artikel dihapus.' });
  })
);

// ============================ HALAMAN STATIS ============================
const pageSchema = z.object({
  slug: z.string().trim().min(1, 'Slug wajib diisi.').max(120),
  title: z.string().trim().min(1, 'Judul halaman wajib diisi.'),
  content: z.string().optional().default(''),
  seoTitle: z.string().optional().default(''),
  seoDesc: z.string().optional().default(''),
  status: z.enum(PAGE_STATUS).optional().default('DRAFT'),
});
const pageUpdate = pageSchema.extend({ id: z.string().min(1) });

router.get(
  '/pages',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.page.findMany({ orderBy: [{ updatedAt: 'desc' }] });
    res.json({ success: true, data: { pages: rows } });
  })
);

router.get(
  '/pages/:id',
  asyncHandler(async (req, res) => {
    const page = await prisma.page.findUnique({ where: { id: req.params.id } });
    if (!page) throw new ApiError(404, 'Halaman tidak ditemukan.');
    res.json({ success: true, data: { page } });
  })
);

router.post(
  '/pages',
  validate(pageSchema),
  asyncHandler(async (req, res) => {
    const created = await prisma.page.create({
      data: {
        ...req.body,
        slug: req.body.slug.toLowerCase().replace(/\s+/g, '-'),
        content: sanitizeHtml(req.body.content || ''),
      },
    });
    res.status(201).json({ success: true, data: { page: created } });
  })
);

router.put(
  '/pages',
  validate(pageUpdate),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const existing = await prisma.page.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Halaman tidak ditemukan.');
    const updated = await prisma.page.update({
      where: { id },
      data: {
        ...data,
        slug: (data.slug || existing.slug).toLowerCase().replace(/\s+/g, '-'),
        content: sanitizeHtml(data.content || ''),
      },
    });
    res.json({ success: true, data: { page: updated } });
  })
);

router.delete(
  '/pages/:id',
  asyncHandler(async (req, res) => {
    await prisma.page.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Halaman dihapus.' });
  })
);

// ============================ BANNER ============================
const bannerSchema = z.object({
  title: z.string().trim().min(1, 'Judul banner wajib diisi.'),
  subtitle: z.string().optional().default(''),
  imageUrl: z.string().optional().default(''),
  linkUrl: z.string().optional().default(''),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
});
const bannerUpdate = bannerSchema.extend({ id: z.string().min(1) });

router.get(
  '/banners',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.banner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    res.json({ success: true, data: { banners: rows } });
  })
);
router.post(
  '/banners',
  validate(bannerSchema),
  asyncHandler(async (req, res) => {
    const created = await prisma.banner.create({ data: req.body });
    res.status(201).json({ success: true, data: { banner: created } });
  })
);
router.put(
  '/banners',
  validate(bannerUpdate),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const updated = await prisma.banner.update({ where: { id }, data });
    res.json({ success: true, data: { banner: updated } });
  })
);
router.delete(
  '/banners/:id',
  asyncHandler(async (req, res) => {
    const banner = await prisma.banner.findUnique({ where: { id: req.params.id } });
    if (banner) {
      await deleteUpload(banner.imageUrl);
      await prisma.banner.delete({ where: { id: banner.id } });
    }
    res.json({ success: true, message: 'Banner dihapus.' });
  })
);

// ============================ TESTIMONI ============================
const testimonialSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.'),
  company: z.string().optional().default(''),
  content: z.string().trim().min(1, 'Isi testimoni wajib diisi.'),
  rating: z.coerce.number().int().min(1).max(5).optional().default(5),
  avatarUrl: z.string().optional().default(''),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
});
const testimonialUpdate = testimonialSchema.extend({ id: z.string().min(1) });

router.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.testimonial.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    res.json({ success: true, data: { testimonials: rows } });
  })
);
router.post(
  '/testimonials',
  validate(testimonialSchema),
  asyncHandler(async (req, res) => {
    const created = await prisma.testimonial.create({ data: req.body });
    res.status(201).json({ success: true, data: { testimonial: created } });
  })
);
router.put(
  '/testimonials',
  validate(testimonialUpdate),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const updated = await prisma.testimonial.update({ where: { id }, data });
    res.json({ success: true, data: { testimonial: updated } });
  })
);
router.delete(
  '/testimonials/:id',
  asyncHandler(async (req, res) => {
    const row = await prisma.testimonial.findUnique({ where: { id: req.params.id } });
    if (row) {
      await deleteUpload(row.avatarUrl);
      await prisma.testimonial.delete({ where: { id: row.id } });
    }
    res.json({ success: true, message: 'Testimoni dihapus.' });
  })
);

// ============================ KLIEN ============================
const clientSchema = z.object({
  name: z.string().trim().min(1, 'Nama klien wajib diisi.'),
  logoUrl: z.string().optional().default(''),
  website: z.string().optional().default(''),
  sortOrder: z.coerce.number().int().optional().default(0),
});
const clientUpdate = clientSchema.extend({ id: z.string().min(1) });

router.get(
  '/clients',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.client.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    res.json({ success: true, data: { clients: rows } });
  })
);
router.post(
  '/clients',
  validate(clientSchema),
  asyncHandler(async (req, res) => {
    const created = await prisma.client.create({ data: req.body });
    res.status(201).json({ success: true, data: { client: created } });
  })
);
router.put(
  '/clients',
  validate(clientUpdate),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const updated = await prisma.client.update({ where: { id }, data });
    res.json({ success: true, data: { client: updated } });
  })
);
router.delete(
  '/clients/:id',
  asyncHandler(async (req, res) => {
    const row = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (row) {
      await deleteUpload(row.logoUrl);
      await prisma.client.delete({ where: { id: row.id } });
    }
    res.json({ success: true, message: 'Klien dihapus.' });
  })
);

// ============================ AREA DISTRIBUSI ============================
const areaSchema = z.object({
  name: z.string().trim().min(1, 'Nama area wajib diisi.'),
  type: z.enum(AREA_TYPE).optional().default('KABUPATEN'),
  description: z.string().optional().default(''),
  sortOrder: z.coerce.number().int().optional().default(0),
});
const areaUpdate = areaSchema.extend({ id: z.string().min(1) });

router.get(
  '/distribution-areas',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.distributionArea.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: { areas: rows } });
  })
);
router.post(
  '/distribution-areas',
  validate(areaSchema),
  asyncHandler(async (req, res) => {
    const created = await prisma.distributionArea.create({ data: req.body });
    res.status(201).json({ success: true, data: { area: created } });
  })
);
router.put(
  '/distribution-areas',
  validate(areaUpdate),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const updated = await prisma.distributionArea.update({ where: { id }, data });
    res.json({ success: true, data: { area: updated } });
  })
);
router.delete(
  '/distribution-areas/:id',
  asyncHandler(async (req, res) => {
    await prisma.distributionArea.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Area dihapus.' });
  })
);

// ============================ ATURAN KALKULATOR ============================
const ruleSchema = z.object({
  buildingType: z.string().trim().min(1, 'Jenis bangunan wajib diisi.'),
  minArea: z.coerce.number().min(0).optional().default(0),
  maxArea: z.coerce.number().min(0).optional().default(0),
  mediaType: z.string().optional().default('POWDER'),
  fireClass: z.string().optional().default('A'),
  unitPerArea: z.coerce.number().positive().optional().default(0.1),
  minUnits: z.coerce.number().int().min(1).optional().default(1),
  notes: z.string().optional().default(''),
  sortOrder: z.coerce.number().int().optional().default(0),
});
const ruleUpdate = ruleSchema.extend({ id: z.string().min(1) });

router.get(
  '/calculator-rules',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.calculatorRule.findMany({ orderBy: [{ sortOrder: 'asc' }] });
    res.json({ success: true, data: { rules: rows } });
  })
);
router.post(
  '/calculator-rules',
  validate(ruleSchema),
  asyncHandler(async (req, res) => {
    const created = await prisma.calculatorRule.create({ data: req.body });
    res.status(201).json({ success: true, data: { rule: created } });
  })
);
router.put(
  '/calculator-rules',
  validate(ruleUpdate),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const updated = await prisma.calculatorRule.update({ where: { id }, data });
    res.json({ success: true, data: { rule: updated } });
  })
);
router.delete(
  '/calculator-rules/:id',
  asyncHandler(async (req, res) => {
    await prisma.calculatorRule.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Aturan dihapus.' });
  })
);

// ============================ UNGGAH GAMBAR UMUM (artikel/banner/dsb) ============================
router.post(
  '/content/image',
  uploadImage.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'Tidak ada file yang diunggah.');
    const url = await storeUpload(req.file);
    res.status(201).json({ success: true, data: { url } });
  })
);

export default router;
