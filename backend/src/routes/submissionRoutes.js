import { Router } from 'express';
import {
  getSubmissions,
  getSubmissionById,
  createSubmission,
  reviewSubmission,
  deleteSubmission
} from '../controllers/submissionController.js';
import { authenticateToken, requireEditor, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import rateLimit from 'express-rate-limit';
import {
  validateCreateSubmission,
  validateReviewSubmission,
  validateGetSubmissions,
  validateCreateReport
} from '../middleware/validation.js';
import { createReport } from '../controllers/reportController.js';
import { reportLimiter } from './reportRoutes.js';

const router = Router();

// Rate limiter for creative submissions: max 10 submissions per user/IP per hour
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // max 10 submissions per window
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true, // Failed/validation-rejected requests do not consume user submission quota
  skip: (req) => req.headers['x-test-suite'] === 'true' && process.env.NODE_ENV !== 'production',
  message: {
    error: 'Too many submissions received from this IP or account. Please wait an hour before submitting another piece.'
  }
});

// Public explore & search (Editor token recognized if present for pending queue)
router.get('/', optionalAuth, validateGetSubmissions, getSubmissions);

// Single piece detail (Approved only for public; editor can view pending/rejected)
router.get('/:id', optionalAuth, getSubmissionById);

// Public / Student reporting endpoint for a submission
router.post('/:id/report', reportLimiter, validateCreateReport, createReport);

// Project submission (Signed-in students only; status strictly forced to 'pending')
router.post(
  '/',
  authenticateToken,
  upload.single('file'),
  validateCreateSubmission,
  submissionLimiter,
  createSubmission
);

// Editor-only review action (Approve or Reject with optional comment)
router.patch('/:id/review', authenticateToken, requireEditor, validateReviewSubmission, reviewSubmission);

// Editor-only deletion
router.delete('/:id', authenticateToken, requireEditor, deleteSubmission);

export default router;
