import Event from '../models/Event.js';
import { parse } from 'json2csv';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import { sendEmail } from '../utils/sendEmail.js';

// Create an Event
export const createEvent = async (req, res) => {
  const { title, description, date, time, location, category, price, image, sessions } = req.body;
  try {
    const newEvent = new Event({
      title,
      description,
      date,
      time,
      location,
      category,
      price,
      image,
      createdBy: req.user._id,
      sessions
    });
    const savedEvent = await newEvent.save();
    res.status(201).json({ message: 'Event created successfully', event: savedEvent });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update an Event
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, date, time, location, category, price, image, sessions } = req.body;
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { title, description, date, time, location, category, price, image, sessions },
      { new: true }
    );
    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Delete an Event
export const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get all Events with Search and Filter
export const getAllEvents = async (req, res) => {
  const { date, location, category, priceRange } = req.query;
  const query = {};

  if (date) query.date = { $gte: new Date(date) };
  if (location) query.location = { $regex: location, $options: 'i' };
  if (category) query.category = category;
  if (priceRange) {
    const [minPrice, maxPrice] = priceRange.split('-');
    query.price = { $gte: minPrice, $lte: maxPrice };
  }

  try {
    const events = await Event.find(query);
    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get Event Details by ID
export const getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ event });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get All Event Details
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({}, {createdBy:0,createdAt:0,updatedAt:0} ); // Fetch all events
    if (events.length === 0) {
      return res.status(404).json({ message: 'No events found' }); // No events found
    }
    res.status(200).json({ events }); // Return the events
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message }); // Handle server errors
  }
};

// Get attendees for an event
export const getAttendees = async (req, res) => {
  const { eventId } = req.params;  // Access the eventId from req.params

  try {
    // Ensure eventId is provided and is a valid ObjectId
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid or missing Event ID' });
    }

    // Fetch orders for the given event ID and populate user details (name and email)
    const orders = await Order.find({ event: eventId }).populate('user', 'name email');

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No attendees found for this event' });
    }

    // Map the orders to extract attendee information, including name and email
    const attendees = orders.map(order => ({
      name: order.user.name,           // Access user's name
      email: order.user.email,         // Access user's email
      ticket: order.ticket,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      userId: order.user._id           // Include user ID for adding to event attendees
    }));

    // Update the event's attendees array
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Push attendees to the event's attendees array, ensuring no duplicates
    attendees.forEach(attendee => {
      if (!event.attendees.includes(attendee.userId)) {
        event.attendees.push(attendee.userId);
      }
    });

    await event.save(); // Save the updated event

    // Respond with the attendees data
    res.status(200).json({ attendees });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update event schedule (for organizers)
export const updateEventSchedule = async (req, res) => {
  const { id } = req.params;
  const { sessions } = req.body;

  try {
    // Check if the event exists before trying to update
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update the event's schedule
    event.sessions = sessions;
    const updatedEvent = await event.save();

    // Notify registered attendees of the schedule change
    const orders = await Order.find({ event: id }).populate('user', 'email');
    const attendeesEmails = orders.map(order => order.user.email);

    const subject = `Schedule Update for ${updatedEvent.title}`;
    const text = `Dear Attendee,\n\nThe schedule for the event "${updatedEvent.title}" has been updated. Please check the event details for the latest information.\n\nBest regards,\nEvent Management Team`;

    // Send notification emails to all registered attendees
    for (const email of attendeesEmails) {
      await sendEmail(email, subject, text);
    }

    // Return the updated event
    res.status(200).json({ message: 'Event schedule updated successfully and attendees notified', event: updatedEvent });
  } catch (error) {
    console.error('Update Event Error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get event schedule
export const getEventSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ sessions: event.sessions });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get event analytics
export const getEventAnalytics = async (req, res) => {
  const { eventId } = req.params;

  try {
    // Ensure eventId is provided and is a valid ObjectId
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid or missing Event ID' });
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Aggregate data from Order collection
    const orders = await Order.find({ event: eventId });

    // Calculate total ticket sales, attendance, and revenue
    const totalTicketsSold = orders.reduce((acc, order) => acc + order.quantity, 0);
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);

    // Attendance rate (e.g., based on the number of attendees in the Order collection)
    const uniqueAttendees = new Set(orders.map(order => order.user.toString()));
    const totalAttendance = uniqueAttendees.size;

    // Prepare data for response
    const analyticsData = {
      totalTicketsSold,
      totalAttendance,
      totalRevenue,
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location
    };

    // Respond with analytics data
    res.status(200).json({ analyticsData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export attendees as CSV
export const exportAttendees = async (req, res) => {
  const { eventId } = req.params;

  try {
    // Find the event by ID and populate attendees
    const event = await Event.findById(eventId).populate('attendees');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    
    // Map attendees to a CSV-compatible format
    const attendeesData = event.attendees.map(attendee => ({
      name: attendee.name,
      email: attendee.email,
      // Add other fields if necessary
    }));

    // Convert attendees data to CSV format
    const csv = parse(attendeesData);

    // Set headers for CSV file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendees.csv"');
    res.status(200).end(csv);  // End the response with the CSV data
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// sample event data entries:

// 1. Music Festival 2024
// json
// Copy code
// {
//   "title": "Music Festival 2024",
//   "description": "Join us for an unforgettable music festival featuring top bands and artists from around the world.",
//   "date": "2024-11-20",
//   "time": "14:00:00",
//   "location": "Los Angeles, CA",
//   "category": "Music",
//   "price": 149.99,
//   "image": "https://media.istockphoto.com/id/1079608554/photo/music-festival.jpg?s=612x612&w=0&k=20&c=0k-Wa0tKk9_4X1HP-RgC8DjYyWwmtM0wvx7-d8v6JwY="
// }
// 2. Art Exhibition 2024
// json
// Copy code
// {
//   "title": "Art Exhibition 2024",
//   "description": "Explore contemporary art from renowned artists at our annual art exhibition.",
//   "date": "2024-12-05",
//   "time": "18:00:00",
//   "location": "San Francisco, CA",
//   "category": "Art",
//   "price": 75.00,
//   "image": "https://media.istockphoto.com/id/1208131810/photo/modern-art-gallery.jpg?s=612x612&w=0&k=20&c=9S8TwwBzH4CttBLkZ8J3eXtH8VnMwqPIs1nDFpW7WUk="
// }
// 3. Food & Wine Festival
// json
// Copy code
// {
//   "title": "Food & Wine Festival",
//   "description": "Indulge in a gourmet experience with a wide selection of food and wine tastings.",
//   "date": "2024-10-25",
//   "time": "12:00:00",
//   "location": "Chicago, IL",
//   "category": "Food & Drink",
//   "price": 129.99,
//   "image": "https://media.istockphoto.com/id/1130533887/photo/wine-tasting.jpg?s=612x612&w=0&k=20&c=-29leX4LC4g5eqt5mON3knFhlI8SSJrS7k12td7V_9U="
// }
// 4. Tech Startup Pitch Event
// json
// Copy code
// {
//   "title": "Tech Startup Pitch Event",
//   "description": "A chance to hear from emerging tech startups and network with industry leaders.",
//   "date": "2024-11-10",
//   "time": "09:00:00",
//   "location": "Austin, TX",
//   "category": "Business",
//   "price": 89.99,
//   "image": "https://media.istockphoto.com/id/1130283524/photo/business-pitch.jpg?s=612x612&w=0&k=20&c=doOdzYSjq7j0kr-2knS_ezC2g6wly1fHHn9Q7EjP2ts="
// }