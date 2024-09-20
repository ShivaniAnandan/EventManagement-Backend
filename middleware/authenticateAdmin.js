import { authenticate } from './authenticate.js'; // Import the authenticate middleware

export const authenticateAdmin = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.user.role === 'attendee') {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  });
};
