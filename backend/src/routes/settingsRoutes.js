import express from 'express';
import multer from 'multer';
import path from 'path';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import fs from 'fs';

const router = express.Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    
    cb(null, 'qr-' + Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: fileFilter
});

router.use(verifyToken);


router.get('/', getSettings);


router.put('/', authorizeRoles('Admin'), upload.single('qr_image'), updateSettings);

export default router;
