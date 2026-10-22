import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { DEFAULT_SETTINGS } from '../../constants.js';
import { config } from '../../config.js';

const router = Router();

export async function getSettingsMap() {
  const rows = await prisma.setting.findMany();
  const map = {};
  for (const s of DEFAULT_SETTINGS) map[s.key] = s.value;
  for (const r of rows) map[r.key] = r.value;
  return map;
}

// GET /api/public/settings -> hanya data yang aman untuk publik
router.get(
  '/settings',
  async (_req, res, next) => {
    try {
      const map = await getSettingsMap();
      const safe = {
        siteName: map.siteName,
        tagline: map.tagline,
        logoUrl: map.logoUrl,
        faviconUrl: map.faviconUrl,
        whatsapp: map.whatsapp,
        whatsappMessage: map.whatsappMessage,
        email: map.email,
        address: map.address,
        mapsEmbed: map.mapsEmbed,
        hours: map.hours,
        instagram: map.instagram,
        facebook: map.facebook,
        youtube: map.youtube,
        tiktok: map.tiktok,
        footerText: map.footerText,
        footerAddress: map.footerAddress,
        heroTitle: map.heroTitle,
        heroSubtitle: map.heroSubtitle,
        heroImage: map.heroImage,
        ctaTitle: map.ctaTitle,
        ctaSubtitle: map.ctaSubtitle,
        certificateTitle: map.certificateTitle,
        certificates: map.certificates,
        inquiryEnabled: config.inquiryEnabled,
      };
      res.json({ success: true, data: { settings: safe } });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
