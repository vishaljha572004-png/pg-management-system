import express from 'express';
import multer from 'multer';
import path from 'path';
import { submitPayment, verifyPayment, getPendingVerifications, simulatePayment } from '../controllers/paymentController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

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
router.post('/submit', authorizeRoles('student'), upload.single('screenshot'), submitPayment);

// Admin verifies payment
router.post('/verify', authorizeRoles('admin'), verifyPayment);
router.get('/pending', authorizeRoles('admin'), getPendingVerifications);

// Development mode payment simulation
router.post('/simulate', authorizeRoles('student'), simulatePayment);

export default router;
