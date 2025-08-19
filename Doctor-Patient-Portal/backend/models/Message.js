// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  messageType: {
    type: String,
    enum: [
        'text',
        'appointment_request',
        'appointment_response',
        'appointment_counter',
        'appointment_reschedule_request',
        'appointment_cancellation_request', // New type
        'appointment_cancellation_response' // New type
    ],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'denied', 'countered', 'cancelled'],
    default: 'pending'
  },
  requestedDate: { type: Date },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  isEdited: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  notified: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);