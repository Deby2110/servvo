import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { uniqueSlug } from '../../lib/slug.js';
import { normalizeSpecifications, parsePageParams } from '../../lib/helpers.js';
import { uploadImage, uploadPdf } from '../../lib/upload.js';
import { deleteUpload, storeUpload } from '../../lib/objectStorage.js';
import { PRODUCT_STATUS, STOCK_STATUS_LIST, MEDIA_TYPE_LIST, FIRE_CLASS_LIST } from '../../constants.js';

const router = Router();

const imageInclude = { images: { orderBy: { sortOrder: 'asc' } } };

const specSchema = z
  .array(
    z.object({
      label: z.string(),
      value: z.string(),
    })
  )
  .optional()
  .default([]);

const productSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi.').max(200),
  sku: z.string().optional().default(''),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional().default(''),
  specifications: specSchema,
  mediaType: z.enum(MEDIA_TYPE_LIST).optional().default('POWDER'),
  capacity: z.string().optional().default(''),
  fireClass: z.enum(FIRE_CLASS_LIST).optional().default('A'),
  hargaInternal: z.coerce.number().int().min(0, 'Harga tidak boleh negatif.').optional().default(0),
  statusStok: z.enum(STOCK_STATUS_LIST).optional().default('TERSEDIA'),
  featured: z.boolean().optional().default(false),
  status: z.enum(PRODUCT_STATUS).optional().default('DRAFT'),
  seoTitle: z.string().optional().default(''),
  seoDesc: z.string().optional().default(''),
  datasheetUrl: z.string().optional().default(''),
});

const updateSchema = productSchema.extend({ id: z.string().min(1) });

function toJson(specs) {
  return JSON.stringify(normalizeSpecifications(specs));
}

function serializeAdmin(p) {
  return {
    ...p,
    specifications: normalizeSpecifications(p.specifications),
    imageCount: p.images?.length || 0,
    images: (p.images || []).map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
  };
}

// GET /api/admin/products
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePageParams(req.query, { defaultLimit: 15, maxLimit: 100 });
    const q = (req.query.q || '').toString().trim();
    const status = (req.query.status || '').toString().trim();
    const categoryId = (req.query.categoryId || '').toString().trim();
    const stock = (req.query.stock || '').toString().trim();
    const includeDeleted = req.query.includeDeleted === 'true';

    const where = {};
    if (!includeDeleted) where.deletedAt = null;
    if (status) where.status = status;
    if (stock) where.statusStok = stock;
    if (categoryId) where.categoryId = categoryId;
    if (q) where.OR = [{ name: { contains: q } }, { sku: { contains: q } }];

    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
        include: { ...imageInclude, category: { select: { id: true, name: true } } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        products: rows.map(serializeAdmin),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  })
);

// GET /api/admin/products/:id
router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id },
      include: { ...imageInclude, category: { select: { id: true, name: true } } },
    });
    if (!product) throw new ApiError(404, 'Produk tidak ditemukan.');
    res.json({ success: true, data: { product: serializeAdmin(product) } });
  })
);

// POST /api/admin/products
router.post(
  '/products',
  validate(productSchema),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const slug = await uniqueSlug(prisma.product, data.name);
    const created = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        sku: data.sku || '',
        categoryId: data.categoryId || null,
        description: data.description || '',
        specifications: toJson(data.specifications),
        mediaType: data.mediaType,
        capacity: data.capacity || '',
        fireClass: data.fireClass,
        hargaInternal: data.hargaInternal,
        statusStok: data.statusStok,
        featured: data.featured,
        status: data.status,
        seoTitle: data.seoTitle || '',
        seoDesc: data.seoDesc || '',
      },
    });
    res.status(201).json({ success: true, data: { product: created } });
  })
);

// PUT /api/admin/products
router.put(
  '/products',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { id, ...data } = req.body;
    const existing = await prisma.product.findFirst({ where: { id } });
    if (!existing) throw new ApiError(404, 'Produk tidak ditemukan.');
    const slug =
      data.name && data.name !== existing.name
        ? await uniqueSlug(prisma.product, data.name, { excludeId: id })
        : existing.slug;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        sku: data.sku || '',
        categoryId: data.categoryId || null,
        description: data.description || '',
        specifications: toJson(data.specifications),
        mediaType: data.mediaType,
        capacity: data.capacity || '',
        fireClass: data.fireClass,
        hargaInternal: data.hargaInternal,
        statusStok: data.statusStok,
        featured: data.featured,
        status: data.status,
        seoTitle: data.seoTitle || '',
        seoDesc: data.seoDesc || '',
        datasheetUrl: data.datasheetUrl || existing.datasheetUrl,
      },
    });
    res.json({ success: true, data: { product: updated } });
  })
);

// POST /api/admin/products/:id/duplicate
router.post(
  '/products/:id/duplicate',
  asyncHandler(async (req, res) => {
    const src = await prisma.product.findFirst({
      where: { id: req.params.id },
      include: imageInclude,
    });
    if (!src) throw new ApiError(404, 'Produk tidak ditemukan.');
    const slug = await uniqueSlug(prisma.product, `${src.name} (Salinan)`);
    const created = await prisma.product.create({
      data: {
        name: `${src.name} (Salinan)`,
        slug,
        sku: src.sku ? `${src.sku}-COPY` : '',
        categoryId: src.categoryId,
        description: src.description,
        specifications: src.specifications,
        mediaType: src.mediaType,
        capacity: src.capacity,
        fireClass: src.fireClass,
        hargaInternal: src.hargaInternal,
        statusStok: src.statusStok,
        featured: false,
        status: 'DRAFT',
        seoTitle: src.seoTitle,
        seoDesc: src.seoDesc,
        images: {
          create: (src.images || []).map((img, i) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
            sortOrder: i,
          })),
        },
      },
    });
    res.status(201).json({ success: true, data: { product: created } });
  })
);

// DELETE /api/admin/products/:id (soft delete)
router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.product.findFirst({ where: { id } });
    if (!existing) throw new ApiError(404, 'Produk tidak ditemukan.');
    const updated = await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DRAFT' },
    });
    res.json({ success: true, message: 'Produk dipindahkan ke sampah.', data: { id: updated.id } });
  })
);

// POST /api/admin/products/:id/images (unggah banyak)
router.post(
  '/products/:id/images',
  uploadImage.array('images', 12),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({ where: { id: req.params.id } });
    if (!product) throw new ApiError(404, 'Produk tidak ditemukan.');
    const files = req.files || [];
    if (files.length === 0) throw new ApiError(400, 'Tidak ada file gambar yang diunggah.');

    const count = await prisma.productImage.count({ where: { productId: product.id } });
    const urls = await Promise.all(files.map((file) => storeUpload(file)));
    const created = await prisma.$transaction(
      files.map((file, i) =>
        prisma.productImage.create({
          data: {
            productId: product.id,
            url: urls[i],
            alt: req.body?.alt || product.name,
            isPrimary: count === 0 && i === 0,
            sortOrder: count + i,
          },
        })
      )
    );
    res.status(201).json({ success: true, data: { images: created } });
  })
);

// PUT /api/admin/products/:id/images -> atur urutan, utama, alt
router.put(
  '/products/:id/images',
  validate(
    z.object({
      images: z
        .array(
          z.object({
            id: z.string(),
            sortOrder: z.coerce.number().int(),
            isPrimary: z.boolean(),
            alt: z.string().optional().default(''),
          })
        )
        .min(1),
    })
  ),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { images } = req.body;
    const product = await prisma.product.findFirst({ where: { id } });
    if (!product) throw new ApiError(404, 'Produk tidak ditemukan.');

    const ids = images.map((i) => i.id);
    const owned = await prisma.productImage.findMany({ where: { id: { in: ids }, productId: id } });
    if (owned.length !== ids.length) throw new ApiError(400, 'Ada gambar yang bukan milik produk ini.');

    const primary = images.find((i) => i.isPrimary) || images[0];
    await prisma.$transaction([
      ...images.map((img) =>
        prisma.productImage.update({ where: { id: img.id }, data: { sortOrder: img.sortOrder } })
      ),
      prisma.productImage.updateMany({
        where: { productId: id },
        data: { isPrimary: false },
      }),
      prisma.productImage.update({ where: { id: primary.id }, data: { isPrimary: true, alt: primary.alt } }),
      ...images.map((img) =>
        prisma.productImage.update({ where: { id: img.id }, data: { alt: img.alt } })
      ),
    ]);
    const result = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: { images: result } });
  })
);

// DELETE /api/admin/products/:id/images/:imageId
router.delete(
  '/products/:id/images/:imageId',
  asyncHandler(async (req, res) => {
    const { imageId } = req.params;
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId: req.params.id },
    });
    if (!image) throw new ApiError(404, 'Gambar tidak ditemukan.');
    await prisma.productImage.delete({ where: { id: imageId } });
    await deleteUpload(image.url);
    // pastikan selalu ada satu foto utama
    const remaining = await prisma.productImage.findMany({
      where: { productId: req.params.id },
      orderBy: { sortOrder: 'asc' },
    });
    if (remaining.length && !remaining.some((r) => r.isPrimary)) {
      await prisma.productImage.update({
        where: { id: remaining[0].id },
        data: { isPrimary: true },
      });
    }
    res.json({ success: true, message: 'Gambar dihapus.' });
  })
);

// POST /api/admin/products/:id/datasheet
router.post(
  '/products/:id/datasheet',
  uploadPdf.single('datasheet'),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({ where: { id: req.params.id } });
    if (!product) throw new ApiError(404, 'Produk tidak ditemukan.');
    if (!req.file) throw new ApiError(400, 'Tidak ada file PDF yang diunggah.');
    const datasheetUrl = await storeUpload(req.file, 'pdf/');
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { datasheetUrl },
    });
    if (product.datasheetUrl) await deleteUpload(product.datasheetUrl);
    res.json({ success: true, data: { datasheetUrl: updated.datasheetUrl } });
  })
);

// DELETE /api/admin/products/:id/datasheet
router.delete(
  '/products/:id/datasheet',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({ where: { id: req.params.id } });
    if (!product) throw new ApiError(404, 'Produk tidak ditemukan.');
    await prisma.product.update({ where: { id: product.id }, data: { datasheetUrl: '' } });
    if (product.datasheetUrl) await deleteUpload(product.datasheetUrl);
    res.json({ success: true, message: 'Datasheet dihapus.' });
  })
);

export default router;
