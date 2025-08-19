const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Link to the main user account for login credentials and role
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  
  // The doctor assigned to this patient
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false // A patient might not have an assigned doctor initially
  },

  // Basic patient information (can be synced from the User model)
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // References to detailed diagnosis records
  diagnosis: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Diagnosis' 
  }],

  // References to detailed prescription records
  prescriptions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Prescription' 
  }],

  // Stores paths to uploaded report files
  reports: [{ 
    type: String 
  }],
});

module.exports = mongoose.model('Patient', patientSchema);
