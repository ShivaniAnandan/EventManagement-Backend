import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  type: {
    type: String,
    enum: ['General Admission', 'VIP'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  availableQuantity: {
    type: Number,
    required: true
  }
});

export default mongoose.model('Ticket', TicketSchema);
