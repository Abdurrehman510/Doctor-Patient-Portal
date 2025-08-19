const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  date: { type: Date, required: true },
  notes: { type: String },
  status: { type: String, enum: ['Scheduled', 'Cancelled'], default: 'Scheduled' },
});

module.exports = mongoose.model('Appointment', appointmentSchema);