import { Router } from 'express';
import settings from './settings.js';
import catalog from './catalog.js';
import gallery from './gallery.js';
import content from './content.js';
import calculator from './calculator.js';
import inquiry from './inquiry.js';
import home from './home.js';

const router = Router();

router.use(home);
router.use(catalog);
router.use(gallery);
router.use(content);
router.use(calculator);
router.use(inquiry);
router.use(settings);

export default router;
