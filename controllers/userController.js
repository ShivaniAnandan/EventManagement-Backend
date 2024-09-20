import User from '../models/User.js';
import Event from '../models/Event.js';
import Order from '../models/Order.js';
import { validationResult } from 'express-validator';

// Update user profile
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, role } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;

    await user.save();
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message});
  }
};

// Fetch user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error',error: error.message });
  }
};

// Get user dashboard
export const getUserDashboard = async (req, res) => {
    const userId = req.user._id; // Assume the user ID is available in req.user after authentication
    
    try {
      // Find upcoming events (this could be adjusted based on your requirements)
      const upcomingEvents = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 });
  
      // Find purchased tickets for the user
      const orders = await Order.find({ user: userId }).populate('ticket').populate('event');
      
      // Create a response object
      const dashboardData = {
        upcomingEvents,
        purchasedTickets: orders
      };
  
      res.status(200).json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
};