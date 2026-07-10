import express from 'express';
import { createRoom, getRooms, assignBed, unassignBed, getUnassignedStudents } from '../controllers/roomController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Strict protection, only 'admin' role can access room management
router.use(verifyToken);
router.use(authorizeRoles('admin'));

router.post('/', createRoom);
router.get('/', getRooms);
router.post('/assign-bed', assignBed);
router.post('/unassign-bed', unassignBed);
router.get('/unassigned-students', getUnassignedStudents);

export default router;
