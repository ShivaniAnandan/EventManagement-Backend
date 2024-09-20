import express from 'express';
import { updateProfile, getProfile, getUserDashboard } from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.put('/profile', authenticate, updateProfile);
router.get('/profile', authenticate, getProfile);
router.get('/dashboard', authenticate, getUserDashboard);

export default router;
