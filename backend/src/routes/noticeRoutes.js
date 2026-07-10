import express from 'express';
import { getNotices, createNotice, deleteNotice } from '../controllers/noticeController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getNotices);
router.post('/', authorizeRoles('admin'), createNotice);
router.delete('/:id', authorizeRoles('admin'), deleteNotice);

export default router;
