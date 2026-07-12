import express from 'express';
import { generateMonthlyRent, getAllRentRecords, markRentAsPaid, getMyRentRecords, studentPayRent } from '../controllers/rentController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Base middleware: All routes require authentication
router.use(verifyToken);

// --- Student Routes ---
router.get('/my-rent', authorizeRoles('Student'), getMyRentRecords);
router.post('/my-rent/pay', authorizeRoles('Student'), studentPayRent);

// --- Admin Routes ---
router.post('/generate', authorizeRoles('Admin'), generateMonthlyRent);
router.get('/', authorizeRoles('Admin'), getAllRentRecords);
router.post('/pay', authorizeRoles('Admin'), markRentAsPaid);

export default router;
