import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createReport,
  createGeneralFeedback,
  getReports,
  updateReportStatus,
  getReportStats
} from '../controllers/reportController.js';
import { authenticateToken, requireEditor } from '../middleware/auth.js';
import {
  validateCreateReport,
  validateCreateGeneralFeedback,
  validateUpdateReport
} from '../middleware/validation.js';

const router = Router();

// Rate limiter for reporting: max 10 reports per IP per hour
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // max 10 reports per hour
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  skip: (req) => req.headers['x-test-suite'] === 'true' && process.env.NODE_ENV !== 'production',
  message: {
    error: 'Too many reports received from this IP address. Please wait an hour before submitting another report.'
  }
});

// Public / Student reporting endpoint: POST /api/reports/submission/:id
router.post('/submission/:id', reportLimiter, validateCreateReport, createReport);

// Public / Student general website feedback & bug reporting: POST /api/reports/general (or POST /api/reports)
router.post('/general', reportLimiter, validateCreateGeneralFeedback, createGeneralFeedback);
router.post('/', reportLimiter, validateCreateGeneralFeedback, createGeneralFeedback);

// Editor moderation endpoints
router.get('/stats', authenticateToken, requireEditor, getReportStats);
router.get('/', authenticateToken, requireEditor, getReports);
router.patch('/:id', authenticateToken, requireEditor, validateUpdateReport, updateReportStatus);

export default router;
