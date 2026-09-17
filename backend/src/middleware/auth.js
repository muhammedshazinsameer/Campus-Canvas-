import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campus_canvas_fallback_secret_key';

/**
 * Middleware to require a valid JWT token
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, campusId: true, avatarUrl: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Authentication failed: User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to strictly require editor role
 */
export function requireEditor(req, res, next) {
  if (!req.user || req.user.role !== 'editor') {
    return res.status(403).json({ error: 'Access denied: Editor role required' });
  }
  next();
}

/**
 * Middleware that softly decodes token if present, but allows anonymous access
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true }
    });
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
}
