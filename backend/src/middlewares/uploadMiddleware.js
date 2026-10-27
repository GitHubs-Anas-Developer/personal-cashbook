import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { config } from '../config/index.js';

// Ensure upload directory exists
const uploadPath = path.resolve(config.uploadDir);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(16).toString('hex');
    cb(null, `receipt-${Date.now()}-${hash}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (config.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, WebP, and PDF files are allowed.'), false);
  }
};

export const receiptUpload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize
  },
  fileFilter
});
