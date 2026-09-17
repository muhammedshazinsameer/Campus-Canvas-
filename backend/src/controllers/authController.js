import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campus_canvas_fallback_secret_key';
const YENEPOYA_REGEX = /^[a-zA-Z0-9._%+-]+@yenepoya\.edu\.in$/i;

/**
 * Sync Google User with database
 * Used by Supabase Google OAuth sign-in flow
 * 
 * Rules:
 * 1. Strictly enforce @yenepoya.edu.in domain
 * 2. On first sign-in, create User linked to Supabase auth.users id, role='student', extract campusId
 * 3. On every sign-in, sync name, email, avatarUrl, and campusId
 */
export async function syncGoogleUser(req, res) {
  try {
    const { id, email, name, avatarUrl } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Google account email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Strictly enforce Yenepoya college email domain
    if (!normalizedEmail.endsWith('@yenepoya.edu.in')) {
      return res.status(403).json({
        error: 'Please sign in with your Yenepoya college email.'
      });
    }

    // 2. Extract Campus ID from email prefix (e.g. "13243" from "13243@yenepoya.edu.in")
    const campusId = normalizedEmail.split('@')[0];
    const displayName = (name || campusId).trim();

    // 3. Find existing user by Supabase ID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          id ? { id } : undefined,
          { email: normalizedEmail }
        ].filter(Boolean)
      }
    });

    if (user) {
      // If user exists with old ID, re-align ID to Supabase auth.users UUID
      if (id && user.id !== id) {
        try {
          await prisma.submission.updateMany({
            where: { authorId: user.id },
            data: { authorId: id }
          });
          await prisma.submission.updateMany({
            where: { reviewerId: user.id },
            data: { reviewerId: id }
          });
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { id }
          });
          user.id = updatedUser.id;
        } catch (linkErr) {
          console.warn('ID re-link notice:', linkErr.message);
        }
      }

      // Sync user's name, email, avatarUrl, and campusId on every sign-in
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: displayName,
          email: normalizedEmail,
          campusId: campusId,
          avatarUrl: avatarUrl || user.avatarUrl
        }
      });
    } else {
      // First-ever sign-in: auto-provision new student row linked to Supabase auth.users id
      user = await prisma.user.create({
        data: {
          id: id || undefined, // Linked directly to Supabase auth.users UUID
          name: displayName,
          email: normalizedEmail,
          campusId: campusId,
          avatarUrl: avatarUrl || null,
          role: 'student'
        }
      });
    }

    // 4. Issue standard 24-hour session token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, campusId: user.campusId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        campusId: user.campusId,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('syncGoogleUser error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google profile' });
  }
}

// Alias for backwards compatibility with any existing route callers
export const googleLogin = syncGoogleUser;

/**
 * Editor Desk Login (used exclusively by the Editor Review Dashboard on port 5174)
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify user exists in database and holds an editor role
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail }
    });

    if (!user || user.role !== 'editor') {
      return res.status(403).json({
        error: 'Access denied: Only authorized editors can access the Editorial Review Desk.'
      });
    }

    // 2. Authenticate credentials via Supabase Auth
    let authenticated = false;
    const supabaseUrl = process.env.SUPABASE_URL || 'https://enxdsfmzflholauapnli.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueGRzZm16Zmxob2xhdWFwbmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NDI3NjIsImV4cCI6MjEwNTAxODc2Mn0.bpSR5Ft5nfewTEG0rAWv3gM9GAzev1unrkYgvIOzUeg';

    try {
      const supabaseRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: password
        })
      });

      const supabaseData = await supabaseRes.json();
      if (supabaseRes.ok && supabaseData?.user) {
        authenticated = true;
      } else {
        console.warn('Supabase auth response for editor login:', supabaseData?.error_description || supabaseData?.msg || supabaseData?.code);
      }
    } catch (sbErr) {
      console.warn('Supabase auth network error:', sbErr.message);
    }

    // Fallback: Also check if matching environment editor password
    const envPswd = process.env.editor_pswd || process.env.EDITOR_PASSWORD;
    if (!authenticated && envPswd && password.trim() === envPswd.trim()) {
      authenticated = true;
    }

    if (!authenticated) {
      return res.status(401).json({
        error: 'Invalid credentials. Please verify your editor email and password in Supabase.'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, campusId: user.campusId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Editor login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        campusId: user.campusId
      }
    });
  } catch (error) {
    console.error('Editor login error:', error);
    res.status(500).json({ error: 'Failed to authenticate editor' });
  }
}

/**
 * Get current authenticated student or editor
 */
export async function getCurrentUser(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        campusId: true,
        avatarUrl: true,
        role: true,
        createdAt: true
      }
    });
    res.json({ user });
  } catch (error) {
    console.error('getCurrentUser error:', error);
    res.status(500).json({ error: 'Failed to get current user profile' });
  }
}

// Deprecated stubs to safely handle any lingering legacy requests
export async function register(req, res) {
  return res.status(400).json({
    error: 'Password-based registration is discontinued. Please sign in with your Yenepoya Google account.'
  });
}
export async function loginStep1(req, res) {
  return res.status(400).json({
    error: 'Password sign-in discontinued. Please use Continue with Google.'
  });
}
export async function registerStep1(req, res) {
  return res.status(400).json({
    error: 'Direct registration discontinued. First Google sign-in registers your account.'
  });
}
export async function verifyOtp(req, res) {
  return res.status(400).json({ error: 'Email OTP verification is no longer supported.' });
}
export async function resendOtp(req, res) {
  return res.status(400).json({ error: 'Email OTP verification is no longer supported.' });
}
export async function verify2FALogin(req, res) {
  return res.status(400).json({ error: 'TOTP 2FA is no longer required with Google OAuth.' });
}
export async function setup2FA(req, res) {
  return res.status(400).json({ error: 'Two-factor authentication is handled directly by Google.' });
}
export async function enable2FA(req, res) {
  return res.status(400).json({ error: 'Two-factor authentication is handled directly by Google.' });
}
export async function disable2FA(req, res) {
  return res.status(400).json({ error: 'Two-factor authentication is handled directly by Google.' });
}
