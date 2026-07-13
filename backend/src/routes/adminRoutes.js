import express from 'express';
import { getAdminDashboardSummary, getAllStudents } from '../controllers/adminController.js';
import { getPendingVerifications, verifyIdentity, verifyPolice, vacateStudent, removeStudent } from '../controllers/adminVerificationController.js';
import { inviteStudent } from '../controllers/studentOnboardingController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();


router.use(verifyToken);
router.use(authorizeRoles('Admin'));

router.get('/dashboard', asyncHandler(getAdminDashboardSummary));
router.get('/students', asyncHandler(getAllStudents));
router.post('/invite-student', asyncHandler(inviteStudent));


router.get('/pending-verifications', asyncHandler(getPendingVerifications));
router.post('/verify-identity', asyncHandler(verifyIdentity));
router.post('/verify-police', asyncHandler(verifyPolice));
router.post('/students/:id/vacate', asyncHandler(vacateStudent));
router.post('/students/:id/remove', asyncHandler(removeStudent));

export default router;
