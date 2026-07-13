import express from 'express';
import { 
  raiseComplaint, 
  getMyComplaints, 
  getAllComplaints, 
  updateComplaintStatus 
} from '../controllers/complaintController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.use(verifyToken);


router.post('/student', authorizeRoles('Student'), raiseComplaint);
router.get('/student', authorizeRoles('Student'), getMyComplaints);


router.get('/admin', authorizeRoles('Admin'), getAllComplaints);
router.post('/admin/update', authorizeRoles('Admin'), updateComplaintStatus);

export default router;
