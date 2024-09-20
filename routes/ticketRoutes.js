import express from 'express';
import { createTicket, purchaseTicket, getPurchasedTickets, cancelTicket, transferTicket, getTickets} from '../controllers/ticketController.js';
import {authenticateAdmin} from '../middleware/authenticateAdmin.js';

const router = express.Router();

// Create a new ticket (for organizers)
router.post('/', authenticateAdmin, createTicket);

// GET request to fetch all tickets
router.get('/get-tickets', getTickets);

// Purchase a ticket
router.post('/purchase',  purchaseTicket);

// Get purchased tickets (for users)
router.get('/', getPurchasedTickets);

// Cancel a purchased ticket
router.delete('/cancel',  cancelTicket);

// Transfer a ticket to another user
router.put('/transfer',  transferTicket);

export default router;
