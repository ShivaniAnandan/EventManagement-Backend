import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/eventRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { validateCreateEvent} from './middleware/validateEvent.js';
import dotenv from 'dotenv';
import connectDB  from './database/config.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();

const app = express();

//Enable CORS for all origins
app.use(cors());

// Enable CORS for all routes
app.use(cors({
    origin: 'https://marvelous-tanuki-ec42fd.netlify.app', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Adjust methods as necessary
    credentials: true // If you need to send cookies or authorization headers
  }));

app.use(cookieParser());

const PORT = process.env.PORT;

connectDB();

// Middleware
app.use(bodyParser.json());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin',adminRoutes);

app.use('/', (req, res) => {
    res.send('Welcome to the Event Management API');
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


