import express from 'express';
import { getAdminDashboardSummary, getAllStudents } from '../controllers/adminController.js';
import { getPendingVerifications, verifyIdentity, verifyPolice, vacateStudent, removeStudent } from '../controllers/adminVerificationController.js';
import { inviteStudent } from '../controllers/studentOnboardingController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Strict protection, only 'Admin' role can access
router.use(verifyToken);
router.use(authorizeRoles('Admin'));

router.get('/dashboard', getAdminDashboardSummary);
router.get('/students', getAllStudents);
router.post('/invite-student', inviteStudent);

// Verification & Tenant Management
router.get('/pending-verifications', getPendingVerifications);
router.post('/verify-identity', verifyIdentity);
router.post('/verify-police', verifyPolice);
router.post('/students/:id/vacate', vacateStudent);
router.post('/students/:id/remove', removeStudent);

export default router;
