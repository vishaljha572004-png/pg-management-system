import express from 'express';
import multer from 'multer';
import path from 'path';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Multer config for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Uploads directory in root of backend
  },
  filename: function (req, file, cb) {
    // e.g. qr-1623847293847.png
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

router.use(verifyToken);

// Public (to authenticated users, i.e., students need to see it)
router.get('/', getSettings);

// Admin only
router.put('/', authorizeRoles('Admin'), upload.single('qr_image'), updateSettings);

export default router;
