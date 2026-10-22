import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import auth from './auth.js';
import dashboard from './dashboard.js';
import categories from './categories.js';
import products from './products.js';
import gallery from './gallery.js';
import content from './content.js';
import inquiries from './inquiries.js';
import settings from './settings.js';
import media from './media.js';

const router = Router();

// Auth publik (login/refresh/logout)
router.use('/auth', auth);

// Semua endpoint di bawahnya wajib terautentikasi
router.use(requireAuth);

router.use(dashboard);
router.use(categories);
router.use(products);
router.use(gallery);
router.use(content);
router.use(inquiries);
router.use(settings);
router.use(media);

export default router;
