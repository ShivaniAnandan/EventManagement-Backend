import express from 'express';
import{ 
    getAllEvents, 
    approveOrRejectEvent, 
    getAllUsers, 
    // deactivateUser,
    toggleUserActivation 
} from '../controllers/adminController.js';
import {authenticateAdmin} from '../middleware/authenticateAdmin.js';

const router = express.Router();

// GET /api/admin/events - Get all events with approval status
router.get('/events', authenticateAdmin, getAllEvents);

// PUT /api/admin/events/approve - Approve or reject event
router.put('/events/approve', authenticateAdmin, approveOrRejectEvent);

// GET /api/admin/users - Get all users with account statuses
router.get('/users', authenticateAdmin, getAllUsers);

// PUT /api/admin/users/deactivate - Deactivate user account
// router.put('/users/deactivate', authenticateAdmin, deactivateUser);

// Route to activate or deactivate a user
router.put('/users/:action', authenticateAdmin, toggleUserActivation);

export default router;
