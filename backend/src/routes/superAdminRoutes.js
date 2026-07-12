import express from 'express';
import { 
  createAdmin, getAdmins, updateAdminStatus, deleteAdmin,
  createPG, getPGs, getHostelDetails, updatePGStatus, deletePG 
} from '../controllers/superAdminController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Apply middleware to all routes in this file
router.use(verifyToken);
router.use(authorizeRoles('Super Admin'));

// PG Management Routes
router.post('/pgs', asyncHandler(createPG));
router.get('/pgs', asyncHandler(getPGs));
router.get('/pgs/:id', asyncHandler(getHostelDetails));
router.put('/pgs/:id/status', asyncHandler(updatePGStatus));
router.delete('/pgs/:id', asyncHandler(deletePG));

// Admin Management Routes
router.post('/admins', asyncHandler(createAdmin));
router.get('/admins', asyncHandler(getAdmins));
router.put('/admins/:id/status', asyncHandler(updateAdminStatus));
router.delete('/admins/:id', asyncHandler(deleteAdmin));

export default router;
