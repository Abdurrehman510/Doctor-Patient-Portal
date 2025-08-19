// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const Message = require('../models/Message');
const Patient = require('../models/Patient');
const User = require('../models/User');

const auth = passport.authenticate('jwt', { session: false });

// Get chat history (no change)
router.get('/:userId1/:userId2', auth, async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error('Error fetching chat history:', err.message);
    res.status(500).json({ message: 'Server error while fetching chat history.' });
  }
});

// UPDATED: Route for patient to request an appointment with a specific date
router.post('/request-appointment', auth, async (req, res) => {
    try {
        const patientProfile = await Patient.findOne({ userId: req.user.id });
        if (!patientProfile || !patientProfile.doctorId) {
            return res.status(400).json({ message: 'You must be assigned to a doctor to make a request.' });
        }

        const { message, requestedDate } = req.body;
        if (!requestedDate) {
            return res.status(400).json({ message: 'A requested date is required.' });
        }

        const doctor = await User.findById(patientProfile.doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Assigned doctor not found.' });
        }

        const appointmentRequest = new Message({
            senderId: req.user.id,
            receiverId: patientProfile.doctorId,
            message: message || `Appointment request for ${new Date(requestedDate).toLocaleString()}`,
            messageType: 'appointment_request',
            status: 'pending',
            requestedDate: requestedDate
        });

        await appointmentRequest.save();

        const io = req.app.get('socketio');
        const userSockets = req.app.get('userSockets');
        const receiverSocketId = userSockets[patientProfile.doctorId.toString()];

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiveMessage', appointmentRequest);
        }

        res.status(201).json(appointmentRequest);

    } catch (err) {
        console.error('Error creating appointment request:', err.message);
        res.status(500).json({ message: 'Server error while creating request.' });
    }
});

// NEW: Route for patient to request a reschedule
router.post('/request-reschedule', auth, async (req, res) => {
    try {
        const patientProfile = await Patient.findOne({ userId: req.user.id });
         if (!patientProfile || !patientProfile.doctorId) {
            return res.status(400).json({ message: 'You must be assigned to a doctor to make a request.' });
        }
        const { appointmentId, requestedDate, message } = req.body;

        if (!appointmentId || !requestedDate) {
            return res.status(400).json({ message: 'Appointment ID and a new date are required.' });
        }

        const doctor = await User.findById(patientProfile.doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Assigned doctor not found.' });
        }

        const rescheduleRequest = new Message({
            senderId: req.user.id,
            receiverId: patientProfile.doctorId,
            message: message || `I would like to reschedule my appointment to ${new Date(requestedDate).toLocaleString()}.`,
            messageType: 'appointment_reschedule_request',
            status: 'pending',
            requestedDate: requestedDate,
            appointmentId: appointmentId
        });

        await rescheduleRequest.save();

        const io = req.app.get('socketio');
        const userSockets = req.app.get('userSockets');
        const receiverSocketId = userSockets[patientProfile.doctorId.toString()];

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiveMessage', rescheduleRequest);
        }

        res.status(201).json(rescheduleRequest);

    } catch (err) {
        console.error('Error creating reschedule request:', err.message);
        res.status(500).json({ message: 'Server error while creating request.' });
    }
});

// NEW: Route for patient to request appointment cancellation
router.post('/request-cancellation', auth, async (req, res) => {
    try {
        const patientProfile = await Patient.findOne({ userId: req.user.id });
        if (!patientProfile || !patientProfile.doctorId) {
            return res.status(400).json({ message: 'You must be assigned to a doctor to make a request.' });
        }

        const { appointmentId, message } = req.body;
        if (!appointmentId) {
            return res.status(400).json({ message: 'Appointment ID is required.' });
        }

        const cancellationRequest = new Message({
            senderId: req.user.id,
            receiverId: patientProfile.doctorId,
            message: message || `I would like to cancel my appointment.`,
            messageType: 'appointment_cancellation_request',
            status: 'pending',
            appointmentId: appointmentId,
        });
        await cancellationRequest.save();

        const io = req.app.get('socketio');
        const userSockets = req.app.get('userSockets');
        const receiverSocketId = userSockets[patientProfile.doctorId.toString()];

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiveMessage', cancellationRequest);
        }

        res.status(201).json(cancellationRequest);
    } catch (err) {
        console.error('Error creating cancellation request:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;