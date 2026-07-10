import express from 'express';
import { getFinancialReport, getOccupancyReport, getComplaintReport } from '../controllers/reportController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Only admin can access reports
router.use(verifyToken);
router.use(authorizeRoles('admin'));

router.get('/finance', getFinancialReport);
router.get('/occupancy', getOccupancyReport);
router.get('/complaints', getComplaintReport);

export default router;
