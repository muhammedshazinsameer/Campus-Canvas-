import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  getCurrentUser,
  loginStep1,
  registerStep1,
  verifyOtp,
  resendOtp,
  googleLogin,
  verify2FALogin,
  setup2FA,
  enable2FA,
  disable2FA
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateGoogleSync } from '../middleware/validation.js';

const router = Router();

// Sensible rate limiter for sensitive 2FA verification to prevent brute-force OTP attempts
const totpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // max 10 attempts per 5 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please wait 5 minutes before trying again.'
  }
});

// Two-Factor Authentication (Google Authenticator TOTP)
router.post('/verify-2fa-login', totpLimiter, verify2FALogin);
router.post('/2fa/setup', authenticateToken, setup2FA);
router.post('/2fa/enable', authenticateToken, totpLimiter, enable2FA);
router.post('/2fa/disable', authenticateToken, disable2FA);

// Continue with Google (OpenID Connect / Google Identity Services)
router.post('/google', validateGoogleSync, googleLogin);

// Standard endpoints (used by Student portal and Editor Review Dashboard)
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);

// Additional fallback OTP routes (retained)
router.post('/login-step1', loginStep1);
router.post('/register-step1', registerStep1);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

export default router;
