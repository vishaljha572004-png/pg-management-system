import express from 'express';
import { getDashboardSummary } from '../controllers/studentController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// All routes here should be protected and only for students
router.use(verifyToken);
router.use(authorizeRoles('student'));

router.get('/dashboard', asyncHandler(getDashboardSummary));

export default router;
