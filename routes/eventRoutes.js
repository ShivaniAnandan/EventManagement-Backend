import express from 'express';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
  getEvents,
  getAttendees,
  exportAttendees,
  updateEventSchedule,
  getEventSchedule,
  getEventAnalytics
} from '../controllers/eventController.js';
import { authenticate } from '../middleware/authenticate.js';
import {authenticateAdmin} from '../middleware/authenticateAdmin.js';
import { validateCreateEvent, validateUpdateEvent } from '../middleware/validateEvent.js'; // Import both middlewares

const router = express.Router();

// Routes
router.post('/', authenticateAdmin, validateCreateEvent, createEvent); // Create event
router.get('/', getAllEvents); // Get all events
router.get('/get-events', getEvents) // to display all events without filter
router.get('/:id', getEventById); // Get event by ID
router.put('/:id', authenticateAdmin, validateUpdateEvent, updateEvent); // Update event with validation
router.delete('/:id', authenticateAdmin, deleteEvent); // Delete event
router.get('/attendees/:eventId', authenticateAdmin, getAttendees);// Get attendee list (for event organizers)
router.put('/:id/schedule', authenticateAdmin, updateEventSchedule);// Update event schedule
router.get('/:id/schedule', getEventSchedule);// Get event schedule
router.get('/analytics/:eventId', authenticateAdmin, getEventAnalytics);
router.get('/export/:eventId', authenticateAdmin, exportAttendees);// Route for exporting attendees

export default router;
