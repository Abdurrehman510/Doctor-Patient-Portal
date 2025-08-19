const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  date: { type: Date, default: Date.now },
  // Changed from String to an array of Strings
  clinicalFindings: [{ type: String, required: true }],
  diagnosis: [{ type: String, required: true }],
  plan: [{ type: String, required: true }],
});

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
