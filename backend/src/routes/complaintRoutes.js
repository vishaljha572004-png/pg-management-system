import express from 'express';
import { 
  raiseComplaint, 
  getMyComplaints, 
  getAllComplaints, 
  updateComplaintStatus 
} from '../controllers/complaintController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Base middleware for all complaint routes
router.use(verifyToken);

// --- Student Routes ---
router.post('/student', authorizeRoles('student'), raiseComplaint);
router.get('/student', authorizeRoles('student'), getMyComplaints);

// --- Admin Routes ---
router.get('/admin', authorizeRoles('admin'), getAllComplaints);
router.post('/admin/update', authorizeRoles('admin'), updateComplaintStatus);

export default router;
