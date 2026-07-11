import express from 'express';
import { 
  createAdmin, getAdmins, updateAdminStatus, deleteAdmin,
  createPG, getPGs, getHostelDetails, updatePGStatus, deletePG 
} from '../controllers/superAdminController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply middleware to all routes in this file
router.use(verifyToken);
router.use(authorizeRoles('Super Admin'));

// PG Management Routes
router.post('/pgs', createPG);
router.get('/pgs', getPGs);
router.get('/pgs/:id', getHostelDetails);
router.put('/pgs/:id/status', updatePGStatus);
router.delete('/pgs/:id', deletePG);

// Admin Management Routes
router.post('/admins', createAdmin);
router.get('/admins', getAdmins);
router.put('/admins/:id/status', updateAdminStatus);
router.delete('/admins/:id', deleteAdmin);

export default router;
