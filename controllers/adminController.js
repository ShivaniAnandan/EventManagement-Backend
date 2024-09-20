import Event from '../models/Event.js';
import User from '../models/User.js';

// GET all event listings with approval status
export const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find(); // Fetch all events
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
};

// Approve or reject an event
export const approveOrRejectEvent = async (req, res) => {
    const { eventId, approve } = req.body;

    // Validate request body
    if (!eventId || typeof approve !== 'boolean') {
        return res.status(400).json({ message: 'Invalid request data' });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        event.isApproved = approve; // Approve or reject event
        await event.save();

        res.status(200).json({
            message: `Event has been ${approve ? 'approved' : 'rejected'}`,
            approvalStatus: event.isApproved
        });
    } catch (error) {
        res.status(500).json({ message: 'Error approving/rejecting event', error: error.message });
    }
};

// GET all user accounts
export const getAllUsers = async (req, res) => {
    try {
        // Fetch only users with the role 'attendee'
        const users = await User.find({ role: 'attendee' }); 
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// Deactivate user account
// export const deactivateUser = async (req, res) => {
//     const { userId } = req.body;

//     // Validate request body
//     if (!userId) {
//         return res.status(400).json({ message: 'User ID is required' });
//     }

//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         user.isActive = false; // Deactivate user
//         await user.save();

//         res.status(200).json({ message: 'User account deactivated successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Error deactivating user', error: error.message });
//     }
// };

// Activate or deactivate user account
export const toggleUserActivation = async (req, res) => {
    const { userId } = req.body;
    const { action } = req.params; // 'activate' or 'deactivate'

    // Validate request body
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    if (!['activate', 'deactivate'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Activate or deactivate user
        user.isActive = action === 'activate';
        await user.save();

        const message = action === 'activate' 
            ? 'User account activated successfully' 
            : 'User account deactivated successfully';

        res.status(200).json({ message });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling user activation', error: error.message });
    }
};

