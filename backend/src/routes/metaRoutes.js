import { Router } from 'express';
import { getCategories, getTags, getStats } from '../controllers/metaController.js';
import { authenticateToken, requireEditor, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/categories', optionalAuth, getCategories);
router.get('/tags', getTags);
router.get('/stats', authenticateToken, requireEditor, getStats);

export default router;
