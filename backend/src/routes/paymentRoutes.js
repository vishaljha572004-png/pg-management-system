import express from 'express';
import multer from 'multer';
import path from 'path';
import { submitPayment, verifyPayment, getPendingVerifications, simulatePayment } from '../controllers/paymentController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import fs from 'fs';

const router = express.Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, 'payment-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.use(verifyToken);

// Student submits payment screenshot
router.post('/submit', authorizeRoles('Student'), upload.single('screenshot'), submitPayment);

// Admin verifies payment
router.post('/verify', authorizeRoles('Admin'), verifyPayment);
router.get('/pending', authorizeRoles('Admin'), getPendingVerifications);

// Development mode payment simulation
router.post('/simulate', authorizeRoles('Student'), simulatePayment);

export default router;
