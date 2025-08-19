// File: backend/routes/analysis.js

const express = require('express');
const router = express.Router();
const passport = require('passport');
const fs = require('fs').promises; // Using promises for async file reading
const path = require('path');
const pdf = require('pdf-parse'); // Import the new library

const Message = require('../models/Message');
const Patient = require('../models/Patient');
const { extractMedicalEntities } = require('../services/nlpService');

const auth = passport.authenticate('jwt', { session: false });

/**
 * Helper function to format all patient data, including PDF reports, into a single string.
 */
const formatPatientDataForAI = async (patient, messages) => {
    let context = `PATIENT PROFILE:\n`;
    context += `Name: ${patient.name}\n`;
    if (patient.dob) context += `DOB: ${new Date(patient.dob).toLocaleDateString()}\n`;
    if (patient.gender) context += `Gender: ${patient.gender}\n`;
    if (patient.bloodType) context += `Blood Type: ${patient.bloodType}\n`;
    if (patient.allergies?.length) context += `Known Allergies: ${patient.allergies.join(', ')}\n`;
    if (patient.chronicConditions?.length) context += `Chronic Conditions: ${patient.chronicConditions.join(', ')}\n`;
    context += '---\n';

    // ... (Past Diagnoses and Prescriptions sections remain the same) ...

    // NEW: Read and include text from uploaded PDF reports
    if (patient.reports && patient.reports.length > 0) {
        context += 'UPLOADED REPORTS SUMMARY:\n';
        for (const reportPath of patient.reports) {
            try {
                // Construct the full file path on the server
                const fullPath = path.join(__dirname, '..', reportPath);
                const dataBuffer = await fs.readFile(fullPath);
                const data = await pdf(dataBuffer);
                context += `--- Report: ${path.basename(reportPath)} ---\n`;
                context += data.text.substring(0, 2000) + '...\n'; // Add a snippet of the report text
                context += `--- End of Report ---\n\n`;
            } catch (err) {
                console.error(`Could not read or parse report: ${reportPath}`, err);
                context += `--- Report: ${path.basename(reportPath)} (Error reading file) ---\n\n`;
            }
        }
        context += '---\n';
    }


    if (messages?.length) {
        context += 'RECENT CHAT HISTORY (Patient vs Doctor):\n';
        const chatHistory = messages.map(msg => `${msg.senderId.toString() === patient.userId.toString() ? 'Patient' : 'Doctor'}: ${msg.message}`).join('\n');
        context += chatHistory + '\n';
    }

    return context;
};


/**
 * POST /api/analysis/health-summary/:patientId
 * Analyzes all patient data to generate a detailed health summary.
 */
router.post('/health-summary/:patientId', auth, async (req, res) => {
  if (req.user.role !== 'Doctor') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    const patient = await Patient.findById(req.params.patientId)
      .populate('diagnosis')
      .populate('prescriptions');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }
    if (!patient.doctorId || patient.doctorId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You are not authorized for this patient.' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: patient.userId },
        { senderId: patient.userId, receiverId: req.user.id },
      ],
    }).sort({ timestamp: 'asc' });

    // This function is now async because it reads files
    const comprehensiveData = await formatPatientDataForAI(patient, messages);

    const extractedData = await extractMedicalEntities(comprehensiveData);
    res.json(extractedData);

  } catch (error) {
    console.error('Error generating health summary:', error);
    res.status(500).json({ message: 'Server error while generating health summary.' });
  }
});

module.exports = router;
