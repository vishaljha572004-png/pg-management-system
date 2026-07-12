import express from 'express';
import { addElectricityBill, getAllElectricityBills, markElectricityBillPaid } from '../controllers/electricityController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(authorizeRoles('Admin'));

router.post('/', addElectricityBill);
router.get('/', getAllElectricityBills);
router.post('/pay', markElectricityBillPaid);

export default router;
