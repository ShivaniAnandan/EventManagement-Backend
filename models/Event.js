import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: []}],
  isApproved: { 
    type: Boolean, 
    default: true 
  }, // Approval status
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessions: [{
    title: String,
    startTime: String,
    endTime: String,
    speaker: String,
  }],
}, { timestamps: true });

export default mongoose.model('Event', EventSchema);
