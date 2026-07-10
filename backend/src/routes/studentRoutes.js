import express from 'express';
import { getDashboardSummary } from '../controllers/studentController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes here should be protected and only for students
router.use(verifyToken);
router.use(authorizeRoles('student'));

router.get('/dashboard', getDashboardSummary);

export default router;
