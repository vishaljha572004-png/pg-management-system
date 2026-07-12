import express from 'express';
import { getNotices, createNotice, deleteNotice } from '../controllers/noticeController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getNotices);
router.post('/', authorizeRoles('Admin'), createNotice);
router.delete('/:id', authorizeRoles('Admin'), deleteNotice);

export default router;
