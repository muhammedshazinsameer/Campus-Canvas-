import multer from 'multer';

// Use memory storage for direct streaming to Cloudinary or disk fallback
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Allowed formats: JPG, PNG, WEBP, GIF, PDF (SVG is not allowed for security reasons).'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB max file size
  },
  fileFilter
});
