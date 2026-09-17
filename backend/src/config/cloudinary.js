import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary media storage initialized');
} else {
  console.log('Cloudinary credentials not provided; using local storage (/uploads)');
}

/**
 * Uploads a file buffer either to Cloudinary or local disk
 * @param {Express.Multer.File} file
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadMedia(file) {
  if (!file) return { url: null, publicId: null };

  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'campus_canvas',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // Fallback: save to local uploads directory
  const ext = path.extname(file.originalname) || '.bin';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
  const filePath = path.join(uploadsDir, filename);

  fs.writeFileSync(filePath, file.buffer);

  // Return relative URL served by Express
  return {
    url: `/uploads/${filename}`,
    publicId: filename
  };
}

export { cloudinary, isCloudinaryConfigured };
