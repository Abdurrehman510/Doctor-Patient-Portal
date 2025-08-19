const express = require('express');
const router = express.Router();
const passport = require('passport');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Message = require('../models/Message');
const moment = require('moment');
const Diagnosis = require('../models/Diagnosis');
const Prescription = require('../models/Prescription');


// Middleware to protect routes
const auth = passport.authenticate('jwt', { session: false });

// ## GET all patients for the logged-in doctor
router.get('/patients', auth, async (req, res) => {
  try {
    const patients = await Patient.find({ doctorId: req.user.id });
    res.json(patients);
  } catch (err) {
    console.error('Error fetching patients:', err.message);
    res.status(500).json({ message: 'Server error while fetching patients.' });
  }
});

// GET a single patient by ID
router.get('/patients/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    if (patient.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not assigned to this patient.' });
    }

    res.json(patient);
  } catch (err)
  {
    console.error('Error fetching single patient:', err.message);
    res.status(500).json({ message: 'Server error while fetching patient details.' });
  }
});


// ## POST (add) a new patient for the logged-in doctor
router.post('/patients', auth, async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ message: 'Patient name and email are required.' });
  }
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        role: 'Patient',
        password: 'defaultPassword123', // Consider a more secure way to handle this
      });
      await user.save();
    }
    let patient = await Patient.findOne({ userId: user._id });
    if (patient) {
      if (patient.doctorId && patient.doctorId.toString() !== req.user.id) {
          return res.status(400).json({ message: 'This patient is already assigned to another doctor.' });
      }
      patient.doctorId = req.user.id;
    } else {
      patient = new Patient({
        userId: user._id,
        name: user.name,
        email: user.email,
        doctorId: req.user.id,
      });
    }
    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    console.error('Error adding patient:', err.message);
    res.status(500).json({ message: 'Server error while adding patient.' });
  }
});

// ## GET all appointments for the logged-in doctor
router.get('/appointments', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id }).populate(
      'patientId',
      'name email'
    );
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err.message);
    res.status(500).json({ message: 'Server error while fetching appointments.' });
  }
});

// ## POST a new appointment
router.post('/appointments', auth, async (req, res) => {
    const { patientId, date, notes } = req.body;
    if (!patientId || !date) {
        return res.status(400).json({ message: 'Patient ID and date are required.' });
    }
    try {
        const appointmentTime = new Date(date);
        const thirtyMinutes = 30 * 60 * 1000;

        const conflictingAppointment = await Appointment.findOne({
            doctorId: req.user.id,
            date: {
                $gte: new Date(appointmentTime.getTime() - thirtyMinutes),
                $lt: new Date(appointmentTime.getTime() + thirtyMinutes),
            },
        });

        if (conflictingAppointment) {
            return res.status(409).json({ message: 'This time slot is already booked.' });
        }

        const newAppointment = new Appointment({
            doctorId: req.user.id,
            patientId,
            date: appointmentTime,
            notes,
            status: 'Scheduled',
        });
        await newAppointment.save();

        // --- START: NOTIFICATION LOGIC ---
        const patient = await Patient.findById(patientId);
        if (patient) {
            const notificationMessage = new Message({
                senderId: req.user.id,
                receiverId: patient.userId,
                message: `A new appointment has been scheduled for you on ${moment(appointmentTime).format('lll')}.`,
                messageType: 'appointment_response'
            });
            await notificationMessage.save();

            const io = req.app.get('socketio');
            const userSockets = req.app.get('userSockets');
            const receiverSocketId = userSockets[patient.userId.toString()];

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receiveMessage', notificationMessage);
            }
        }
        // --- END: NOTIFICATION LOGIC ---

        res.status(201).json(newAppointment);
    } catch (err) {
        console.error('Error creating appointment:', err.message);
        res.status(500).json({ message: 'Server error while creating appointment.' });
    }
});


// ## PUT (update/reschedule) an existing appointment
router.put('/appointments/:id', auth, async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ message: 'A new date is required for rescheduling.' });
    }
    const appointmentTime = new Date(date);
    const thirtyMinutes = 30 * 60 * 1000;

    const conflictingAppointment = await Appointment.findOne({
      _id: { $ne: req.params.id },
      doctorId: req.user.id,
      date: {
        $gte: new Date(appointmentTime.getTime() - thirtyMinutes),
        $lt: new Date(appointmentTime.getTime() + thirtyMinutes),
      },
    });

    if (conflictingAppointment) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }

    const appointment = await Appointment.findById(req.params.id).populate('patientId');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appointment.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this appointment.' });
    }

    appointment.date = new Date(date);
    await appointment.save();

    res.json({ message: 'Appointment rescheduled successfully.', appointment });
  } catch (err) {
    console.error('Error rescheduling appointment:', err.message);
    res.status(500).json({ message: 'Server error while rescheduling appointment.' });
  }
});

// ## DELETE (cancel) an appointment
router.delete('/appointments/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('patientId');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appointment.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to delete this appointment.' });
    }

    const cancellationMessage = new Message({
        senderId: req.user.id,
        receiverId: appointment.patientId.userId,
        message: `Your appointment on ${moment(appointment.date).format('lll')} has been cancelled by the doctor.`,
        messageType: 'appointment_cancellation_response'
    });
    await cancellationMessage.save();

    const io = req.app.get('socketio');
    const userSockets = req.app.get('userSockets');
    const receiverSocketId = userSockets[appointment.patientId.userId.toString()];

    if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', cancellationMessage);
    }
    
    await Appointment.deleteOne({ _id: req.params.id });
    res.json({ message: 'Appointment deleted successfully.' });
  } catch (err) {
    console.error('Error deleting appointment:', err.message);
    res.status(500).json({ message: 'Server error while deleting appointment.' });
  }
});

// Add a new diagnosis
router.post('/patients/:id/diagnosis', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const { appointmentId, clinicalFindings, diagnosis, plan } = req.body;

    const newDiagnosis = new Diagnosis({
      patientId: patient._id,
      appointmentId,
      clinicalFindings,
      diagnosis,
      plan,
    });

    await newDiagnosis.save();

    patient.diagnosis.push(newDiagnosis._id);
    await patient.save();

    res.status(201).json(newDiagnosis);
  } catch (err) {
    console.error('Error adding diagnosis:', err.message);
    res.status(500).json({ message: 'Server error while adding diagnosis.' });
  }
});

// Add a new prescription
router.post('/patients/:id/prescriptions', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const { appointmentId, medicines, investigations } = req.body;

    const newPrescription = new Prescription({
      patientId: patient._id,
      appointmentId,
      medicines,
      investigations,
    });

    await newPrescription.save();

    patient.prescriptions.push(newPrescription._id);
    await patient.save();

    res.status(201).json(newPrescription);
  } catch (err) {
    console.error('Error adding prescription:', err.message);
    res.status(500).json({ message: 'Server error while adding prescription.' });
  }
});

// Get all diagnoses for a patient
router.get('/patients/:id/diagnosis', auth, async (req, res) => {
  try {
    const diagnoses = await Diagnosis.find({ patientId: req.params.id }).sort({ date: -1 });
    res.json(diagnoses);
  } catch (err) {
    console.error('Error fetching diagnoses:', err.message);
    res.status(500).json({ message: 'Server error while fetching diagnoses.' });
  }
});

// Get all prescriptions for a patient
router.get('/patients/:id/prescriptions', auth, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.id }).sort({ date: -1 });
    res.json(prescriptions);
  } catch (err) {
    console.error('Error fetching prescriptions:', err.message);
    res.status(500).json({ message: 'Server error while fetching prescriptions.' });
  }
});


module.exports = router;
