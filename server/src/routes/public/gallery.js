import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { ApiError, asyncHandler } from '../../lib/errors.js';

const router = Router();

// GET /api/public/gallery/albums
router.get(
  '/gallery/albums',
  asyncHandler(async (_req, res) => {
    const albums = await prisma.album.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { items: true } } },
    });
    const withCover = await Promise.all(
      albums.map(async (a) => {
        const first = await prisma.galleryItem.findFirst({
          where: { albumId: a.id },
          orderBy: { sortOrder: 'asc' },
        });
        return {
          id: a.id,
          title: a.title,
          slug: a.slug,
          description: a.description,
          coverImage: a.coverImage || first?.thumbnailUrl || first?.url || '',
          itemCount: a._count.items,
        };
      })
    );
    res.json({ success: true, data: { albums: withCover } });
  })
);

// GET /api/public/gallery/albums/:slug
router.get(
  '/gallery/albums/:slug',
  asyncHandler(async (req, res) => {
    const album = await prisma.album.findUnique({ where: { slug: req.params.slug } });
    if (!album) throw new ApiError(404, 'Album tidak ditemukan.');
    const items = await prisma.galleryItem.findMany({
      where: { albumId: album.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({
      success: true,
      data: {
        album: {
          id: album.id,
          title: album.title,
          slug: album.slug,
          description: album.description,
          coverImage: album.coverImage,
        },
        items: items.map((i) => ({
          id: i.id,
          type: i.type,
          url: i.url,
          thumbnailUrl: i.thumbnailUrl || i.url,
          caption: i.caption,
          location: i.location,
          takenAt: i.takenAt,
        })),
      },
    });
  })
);

export default router;
