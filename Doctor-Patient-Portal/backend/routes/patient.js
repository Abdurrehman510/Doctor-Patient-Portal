const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const passport = require('passport');
const path = require('path');

// Middleware to protect routes
const auth = passport.authenticate('jwt', { session: false });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/reports',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDFs and images are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ## GET patient profile
router.get('/profile', auth, async (req, res) => {
  try {
    const patientProfile = await Patient.findOne({ userId: req.user.id })
      .populate('doctorId', 'name')
      .populate({
        path: 'diagnosis',
        options: { sort: { date: -1 } }
      })
      .populate({
        path: 'prescriptions',
        options: { sort: { date: -1 } }
      });

    if (!patientProfile) {
      return res.status(404).json({ message: 'Patient profile not found.' });
    }
    
    res.json(patientProfile);

  } catch (err) {
    console.error('Error in /profile route:', err.message);
    res.status(500).json({ message: 'Server error while retrieving profile' });
  }
});

// ## GET all appointments for the logged-in patient
router.get('/appointments', auth, async (req, res) => {
  try {
    // Find patient profile using the authenticated user's ID to get the patient document ID
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const appointments = await Appointment.find({ patientId: patient._id }).populate(
      'doctorId',
      'name'
    );
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err.message);
    res.status(500).json({ message: 'Server error while fetching appointments.' });
  }
});


// Book appointment
router.post('/appointments', authMiddleware(['Patient']), async (req, res) => {
  const { date, notes } = req.body;
  try {
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const appointment = new Appointment({
      doctorId: patient.doctorId,
      patientId: patient._id,
      date: new Date(date),
      notes,
      status: 'Scheduled',
    });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    console.error('Error booking appointment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reschedule appointment
router.put('/appointments/:id', authMiddleware(['Patient']), async (req, res) => {
  const { date, notes } = req.body;
  try {
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const appointment = await Appointment.findOne({ _id: req.params.id, patientId: patient._id });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    appointment.date = new Date(date);
    appointment.notes = notes || appointment.notes;
    appointment.status = 'Scheduled';
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error('Error rescheduling appointment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ## DELETE (cancel) an appointment by the patient
router.delete('/appointments/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
     if (!patient) {
       return res.status(404).json({ message: 'Patient not found' });
     }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to cancel this appointment' });
    }
    appointment.status = 'Cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled successfully.', appointment });
  } catch (err) {
    console.error('Error cancelling appointment:', err.message);
    res.status(500).json({ message: 'Server error while cancelling appointment' });
  }
});


// Upload report
router.post('/upload-report', authMiddleware(['Patient']), upload.single('report'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const reportUrl = `/uploads/reports/${req.file.filename}`;
    patient.reports.push(reportUrl);
    await patient.save();
    res.json({ message: 'Report uploaded successfully', reportUrl });
  } catch (err) {
    console.error('Error uploading report:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;