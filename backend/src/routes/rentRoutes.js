import express from 'express';
import { generateMonthlyRent, getAllRentRecords, markRentAsPaid, getMyRentRecords, studentPayRent } from '../controllers/rentController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Base middleware: All routes require authentication
router.use(verifyToken);

// --- Student Routes ---
router.get('/my-rent', authorizeRoles('student'), getMyRentRecords);
router.post('/my-rent/pay', authorizeRoles('student'), studentPayRent);

// --- Admin Routes ---
router.post('/generate', authorizeRoles('admin'), generateMonthlyRent);
router.get('/', authorizeRoles('admin'), getAllRentRecords);
router.post('/pay', authorizeRoles('admin'), markRentAsPaid);

export default router;
