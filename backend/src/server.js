import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import metaRoutes from './routes/metaRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Trust first reverse proxy hop (critical for Render / Vercel HTTPS & rate limiting)
app.set('trust proxy', 1);

// 2. Production HTTPS Redirection
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// 3. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://*.supabase.co',
          'https://*.googleusercontent.com'
        ],
        connectSrc: [
          "'self'",
          'https://*.supabase.co',
          'https://accounts.google.com',
          'https://res.cloudinary.com'
        ],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Required so frontend on separate origin can load uploaded images
    xFrameOptions: { action: 'deny' },
    xContentTypeOptions: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  })
);

// 4. Strict CORS Configuration (Strict Whitelist, No Wildcards)
const allowedOrigins = [
  'http://localhost:5173', // Local Student Frontend
  'http://localhost:5174', // Local Editor Admin Dashboard
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server health checks, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/reports', reportRoutes);

// Root service info endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Campus Canvas API',
    tagline: 'A Canvas for Every Creative Mind',
    status: 'online',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Campus Canvas API',
    tagline: 'A Canvas for Every Creative Mind',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler - Sanitized for Client Responses
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);

  if (err.message && err.message.includes('not allowed by CORS policy')) {
    return res.status(403).json({ error: 'Access denied: Origin not authorized by CORS policy.' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size exceeds maximum allowed limit (15MB).' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err.message && err.message.includes('Invalid file format')) {
    return res.status(400).json({ error: err.message });
  }

  // Strictly sanitized 500 error: NEVER send err.message, stack traces, or internal DB details to the client
  res.status(500).json({ error: 'Internal server error. Please try again later.' });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Campus Canvas API running on port ${PORT}`);
  console.log(` A Canvas for Every Creative Mind`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});
