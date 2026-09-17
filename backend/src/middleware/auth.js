import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campus_canvas_fallback_secret_key';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://enxdsfmzflholauapnli.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueGRzZm16Zmxob2xhdWFwbmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NDI3NjIsImV4cCI6MjEwNTAxODc2Mn0.bpSR5Ft5nfewTEG0rAWv3gM9GAzev1unrkYgvIOzUeg';

/**
 * Resolves user from token: supports both backend JWT and Supabase Auth session token
 */
async function resolveUserFromToken(token) {
  if (!token) return null;

  // 1. Try verifying with local backend JWT_SECRET
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded?.id) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, campusId: true, avatarUrl: true }
      });
      if (user) return user;
    }
  } catch {
    // Not a backend-issued JWT or signature mismatch (e.g. Supabase token). Fall through to Supabase check.
  }

  // 2. Fallback: verify against Supabase Auth API
  try {
    const sbRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY
      }
    });

    if (sbRes.ok) {
      const sbUser = await sbRes.json();
      if (sbUser?.id || sbUser?.email) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              sbUser.id ? { id: sbUser.id } : undefined,
              sbUser.email ? { email: sbUser.email.toLowerCase().trim() } : undefined
            ].filter(Boolean)
          },
          select: { id: true, name: true, email: true, role: true, campusId: true, avatarUrl: true }
        });
        if (user) return user;
      }
    }
  } catch (sbErr) {
    console.warn('Supabase token verification fallback notice:', sbErr.message);
  }

  return null;
}

/**
 * Middleware to require a valid JWT or Supabase token
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required: No token provided' });
  }

  const user = await resolveUserFromToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
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

  req.user = await resolveUserFromToken(token);
  next();
}

