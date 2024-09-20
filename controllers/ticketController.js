import Ticket from '../models/Ticket.js';
import Order from '../models/Order.js';
import User from '../models/User.js'; // Import User model
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { sendEmail } from '../utils/sendEmail.js';

dotenv.config(); // Load environment variables

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Replace with your Stripe secret key

// Create a new ticket
export const createTicket = async (req, res) => {
  const { event, type, price, availableQuantity } = req.body;
  
  try {
    const newTicket = new Ticket({
      event,
      type,
      price,
      availableQuantity
    });
    
    await newTicket.save();
    res.status(201).json({ message: 'Ticket created successfully', ticket: newTicket });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Controller to fetch all tickets
export const getTickets = async (req, res) => {
  try {
    // Fetch all tickets from the database
    const tickets = await Ticket.find();
    
    // Return the list of tickets
    res.status(200).json({ message: 'Tickets fetched successfully', tickets });
  } catch (error) {
    // Handle errors and send appropriate response
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


export const purchaseTicket = async (req, res) => {
  const { userId, ticketId, quantity } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the ticket
    const ticket = await Ticket.findById(ticketId).populate('event'); // Populate event if necessary
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check ticket availability
    if (quantity > ticket.availableQuantity) {
      return res.status(400).json({ message: 'Not enough tickets available' });
    }

    // Calculate total amount
    const totalAmount = ticket.price * quantity;

    // Create a Stripe Checkout session using INR currency
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr', // Use INR
          product_data: {
            name: 'Event Ticket',
          },
          unit_amount: Math.round(totalAmount * 100), // Convert INR to paise
        },
        quantity,
      }],
      mode: 'payment',
      success_url: `${process.env.DOMAIN}/paymentsuccess`, // Redirect on successful payment
      cancel_url: `${process.env.DOMAIN}/paymentfailure`,   // Redirect on failed payment
    });

    // Create an order (optional)
    const order = new Order({
      user: userId,
      event: ticket.event._id,
      ticket: ticketId,
      quantity,
      totalAmount,
      paymentStatus: 'pending',
      paymentIntentId: session.id,
    });

    // Save the order in the database
    await order.save();

    // Update ticket quantity after successful order creation
    ticket.availableQuantity -= quantity;
    await ticket.save();

    // Send confirmation email to the user
    const subject = `Ticket Purchase Confirmation for ${ticket.event.title}`;
    const text = `Dear ${user.name},\n\nThank you for purchasing ${quantity} ticket(s) for "${ticket.event.title}".\nTotal Amount: $${totalAmount}\n\nWe look forward to seeing you at the event!\n\nBest regards,\nEvent Management Team`;

    await sendEmail(user.email, subject, text);

    // Send a successful response
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    // Handle Stripe errors or other possible errors
    if (error.raw && error.raw.message) {
      return res.status(400).json({ message: error.raw.message });
    }

    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// View purchased tickets

export const getPurchasedTickets = async (req, res) => {
  const userId = req.query.userId;

  try {
    // Validate userId presence
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find orders for the user
    const orders = await Order.find({ user: userId }).populate('ticket').populate('event'); // Ensure you populate the right fields

    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const cancelTicket = async (req, res) => {
  const { orderId } = req.body;

  try {
    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update ticket quantity
    const ticket = await Ticket.findById(order.ticket);
    if (ticket) {
      ticket.availableQuantity += order.quantity; // Restore the available ticket quantity
      await ticket.save();
    }

    // Save refund data (assuming full refund of the ticket amount)
    const refundData = {
      refundAmount: order.totalAmount, // Refund full amount
      quantity: order.quantity, // Quantity of tickets refunded
      ticketId: ticket._id, // Ticket title for reference
      eventId: ticket.event, // Event associated with the ticket
    };

    // Delete the order from the database
    await Order.findByIdAndDelete(orderId);

    // Send response with refund data
    res.status(200).json({
      message: 'Ticket canceled successfully',
      refundData,
    });
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Transfer a ticket to another user
export const transferTicket = async (req, res) => {
  const { orderId, newUserId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Find the new user
    const newUser = await User.findById(newUserId);
    if (!newUser) return res.status(404).json({ message: 'New user not found' });

    // Update the order with the new user
    order.user = newUserId;
    await order.save();

    res.status(200).json({ message: 'Ticket transferred successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};