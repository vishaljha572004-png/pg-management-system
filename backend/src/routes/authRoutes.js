import express from 'express';
import { register, login, adminLogin, superAdminLogin, refresh, logout, getProfile, updateProfile, findPG, registerPG } from '../controllers/authController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

import { body, validationResult } from 'express-validator';

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

const router = express.Router();

// Public Routes
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest
], register);

router.post('/register-pg', [
  body('pg_name').trim().notEmpty().withMessage('PG Name is required'),
  body('owner_name').trim().notEmpty().withMessage('Owner Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest
], registerPG);

router.post('/login', [
  body('email').trim().notEmpty().withMessage('Email or Phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('org_code').trim().notEmpty().withMessage('Org Code is required'),
  validateRequest
], login);

router.post('/admin/login', [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
], adminLogin);

router.post('/super-admin/login', [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
], superAdminLogin);

router.post('/find-pg', [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  validateRequest
], findPG);

router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected Routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

// Example of Admin only route (You can move this to other route files later)
router.get('/admin-data', verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: 'Welcome Admin' });
});

export default router;
