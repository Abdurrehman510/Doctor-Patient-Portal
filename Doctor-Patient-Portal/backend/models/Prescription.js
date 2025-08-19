const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
});

const investigationSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  date: { type: Date, default: Date.now },
  medicines: [medicineSchema],
  investigations: [investigationSchema],
});

module.exports = mongoose.model('Prescription', prescriptionSchema);