import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AutocompleteInput from './AutocompleteInput';
import { clinicalFindingsTerms, diagnosisTerms, planTerms } from '../data/medicalTerms';
import { medicineNames } from '../data/medicines';
import { investigationNames } from '../data/investigations';
import { FiPlus, FiTrash2, FiFileText, FiPackage, FiActivity } from 'react-icons/fi';

const DiagnosisPrescription = ({ patientId, appointments, onNewEntry }) => {
  // State management
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [diagnosisData, setDiagnosisData] = useState({
    appointmentId: '',
    clinicalFindings: [''],
    diagnosis: [''],
    plan: [''],
  });
  const [prescriptionData, setPrescriptionData] = useState({
    appointmentId: '',
    medicines: [{ name: '', dosage: '', duration: '' }],
    investigations: [{ name: '' }],
  });

  // Diagnosis field handlers
  const handleDiagnosisArrayChange = (fieldName, index, e) => {
    const { value } = e.target;
    const list = [...diagnosisData[fieldName]];
    list[index] = value;
    setDiagnosisData({ ...diagnosisData, [fieldName]: list });
  };

  const addDiagnosisField = (fieldName) => {
    setDiagnosisData({
      ...diagnosisData,
      [fieldName]: [...diagnosisData[fieldName], ''],
    });
  };

  const removeDiagnosisField = (fieldName, index) => {
    const list = [...diagnosisData[fieldName]];
    list.splice(index, 1);
    setDiagnosisData({ ...diagnosisData, [fieldName]: list });
  };

  // Prescription field handlers
  const handlePrescriptionAppointmentChange = (e) => {
    setPrescriptionData({ ...prescriptionData, appointmentId: e.target.value });
  };

  const handleFieldChange = (type, index, e) => {
    const { name, value } = e.target;
    const list = [...prescriptionData[type]];
    list[index][name] = value;
    setPrescriptionData({ ...prescriptionData, [type]: list });
  };

  const addPrescriptionField = (type) => {
    const newItem = type === 'medicines' ? { name: '', dosage: '', duration: '' } : { name: '' };
    setPrescriptionData({
      ...prescriptionData,
      [type]: [...prescriptionData[type], newItem],
    });
  };

  const removePrescriptionField = (type, index) => {
    const list = [...prescriptionData[type]];
    list.splice(index, 1);
    setPrescriptionData({ ...prescriptionData, [type]: list });
  };

  // Form submission handlers
  const handleDiagnosisSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosisData.appointmentId) {
      toast.error("Please select an appointment for the diagnosis.");
      return;
    }
    
    const payload = {
      ...diagnosisData,
      clinicalFindings: diagnosisData.clinicalFindings.filter(item => item.trim() !== ''),
      diagnosis: diagnosisData.diagnosis.filter(item => item.trim() !== ''),
      plan: diagnosisData.plan.filter(item => item.trim() !== ''),
    };

    if (payload.clinicalFindings.length === 0 || payload.diagnosis.length === 0 || payload.plan.length === 0) {
      toast.error("Please fill at least one entry for each diagnosis field.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/doctor/patients/${patientId}/diagnosis`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Diagnosis added successfully!');
      setDiagnosisData({ appointmentId: '', clinicalFindings: [''], diagnosis: [''], plan: [''] });
      onNewEntry();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding diagnosis');
    }
  };
  
  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!prescriptionData.appointmentId) {
      toast.error("Please select an appointment for the prescription.");
      return;
    }

    const payload = {
      ...prescriptionData,
      medicines: prescriptionData.medicines.filter(med => med.name.trim() !== ''),
      investigations: prescriptionData.investigations.filter(inv => inv.name.trim() !== ''),
    };

    if (payload.medicines.length === 0 && payload.investigations.length === 0) {
      toast.error("Please add at least one medicine or investigation.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/doctor/patients/${patientId}/prescriptions`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Prescription added successfully!');
      setPrescriptionData({ 
        appointmentId: '', 
        medicines: [{ name: '', dosage: '', duration: '' }], 
        investigations: [{ name: '' }] 
      });
      onNewEntry();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding prescription');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`py-3 px-6 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'diagnosis' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <FiFileText className="text-lg" />
          Diagnosis
        </button>
        <button
          onClick={() => setActiveTab('prescription')}
          className={`py-3 px-6 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'prescription' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <FiPackage className="text-lg" />
          Prescription
        </button>
      </div>

      {/* Diagnosis Form */}
      {activeTab === 'diagnosis' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FiFileText className="text-blue-600 dark:text-blue-400" />
              Patient Diagnosis
            </h4>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} available
            </div>
          </div>
          
          <form onSubmit={handleDiagnosisSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Appointment Selector */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Associated Appointment
                </label>
                <select 
                  name="appointmentId" 
                  value={diagnosisData.appointmentId} 
                  onChange={(e) => setDiagnosisData({...diagnosisData, appointmentId: e.target.value})} 
                  required 
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
                >
                  <option value="">Select appointment date</option>
                  {appointments.map(appt => (
                    <option key={appt._id} value={appt._id}>
                      {new Date(appt.date).toLocaleDateString('en-US', {
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Clinical Findings Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Clinical Findings
                  </label>
                  <button 
                    type="button" 
                    onClick={() => addDiagnosisField('clinicalFindings')} 
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    <FiPlus size={14} /> Add Finding
                  </button>
                </div>
                
                <div className="space-y-3">
                  {diagnosisData.clinicalFindings.map((finding, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="flex-grow">
                        <AutocompleteInput 
                          name={`clinicalFindings-${i}`} 
                          placeholder="e.g., Chest pain, Fever, etc." 
                          value={finding} 
                          onChange={(e) => handleDiagnosisArrayChange('clinicalFindings', i, e)} 
                          suggestions={clinicalFindingsTerms} 
                        />
                      </div>
                      {diagnosisData.clinicalFindings.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeDiagnosisField('clinicalFindings', i)} 
                          className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Remove finding"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Diagnosis Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Diagnosis
                  </label>
                  <button 
                    type="button" 
                    onClick={() => addDiagnosisField('diagnosis')} 
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    <FiPlus size={14} /> Add Diagnosis
                  </button>
                </div>
                
                <div className="space-y-3">
                  {diagnosisData.diagnosis.map((diag, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="flex-grow">
                        <AutocompleteInput 
                          name={`diagnosis-${i}`} 
                          placeholder="e.g., Stable Angina, Hypertension, etc." 
                          value={diag} 
                          onChange={(e) => handleDiagnosisArrayChange('diagnosis', i, e)} 
                          suggestions={diagnosisTerms} 
                        />
                      </div>
                      {diagnosisData.diagnosis.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeDiagnosisField('diagnosis', i)} 
                          className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Remove diagnosis"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Plan Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Treatment Plan
                  </label>
                  <button 
                    type="button" 
                    onClick={() => addDiagnosisField('plan')} 
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    <FiPlus size={14} /> Add Plan
                  </button>
                </div>
                
                <div className="space-y-3">
                  {diagnosisData.plan.map((planItem, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="flex-grow">
                        <AutocompleteInput 
                          name={`plan-${i}`} 
                          placeholder="e.g., Lifestyle modification, Follow-up in 2 weeks, etc." 
                          value={planItem} 
                          onChange={(e) => handleDiagnosisArrayChange('plan', i, e)} 
                          suggestions={planTerms} 
                        />
                      </div>
                      {diagnosisData.plan.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeDiagnosisField('plan', i)} 
                          className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Remove plan item"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button 
                type="submit" 
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                Save Diagnosis
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Prescription Form */}
      {activeTab === 'prescription' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FiPackage className="text-green-600 dark:text-green-400" />
              Medical Prescription
            </h4>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} available
            </div>
          </div>
          
          <form onSubmit={handlePrescriptionSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Appointment Selector */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Associated Appointment
                </label>
                <select 
                  name="appointmentId" 
                  value={prescriptionData.appointmentId} 
                  onChange={handlePrescriptionAppointmentChange} 
                  required 
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-green-500 dark:focus:border-green-500 transition-colors"
                >
                  <option value="">Select appointment date</option>
                  {appointments.map(appt => (
                    <option key={appt._id} value={appt._id}>
                      {new Date(appt.date).toLocaleDateString('en-US', {
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Medicines Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Medications
                  </label>
                  <button 
                    type="button" 
                    onClick={() => addPrescriptionField('medicines')} 
                    className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1"
                  >
                    <FiPlus size={14} /> Add Medicine
                  </button>
                </div>
                
                <div className="space-y-4">
                  {prescriptionData.medicines.map((med, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <AutocompleteInput 
                          name="name" 
                          placeholder="Medicine name" 
                          value={med.name} 
                          onChange={e => handleFieldChange('medicines', i, e)} 
                          suggestions={medicineNames} 
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="text" 
                          name="dosage" 
                          placeholder="Dosage" 
                          value={med.dosage} 
                          onChange={e => handleFieldChange('medicines', i, e)} 
                          required 
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-green-500 dark:focus:border-green-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="text" 
                          name="duration" 
                          placeholder="Duration" 
                          value={med.duration} 
                          onChange={e => handleFieldChange('medicines', i, e)} 
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-green-500 dark:focus:border-green-500"
                        />
                      </div>
                      {prescriptionData.medicines.length > 1 && (
                        <div className="col-span-1 flex justify-center">
                          <button 
                            type="button" 
                            onClick={() => removePrescriptionField('medicines', i)} 
                            className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Remove medicine"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Investigations Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Investigations
                  </label>
                  <button 
                    type="button" 
                    onClick={() => addPrescriptionField('investigations')} 
                    className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1"
                  >
                    <FiPlus size={14} /> Add Investigation
                  </button>
                </div>
                
                <div className="space-y-3">
                  {prescriptionData.investigations.map((inv, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="flex-grow">
                        <AutocompleteInput 
                          name="name" 
                          placeholder="Investigation name" 
                          value={inv.name} 
                          onChange={e => handleFieldChange('investigations', i, e)} 
                          suggestions={investigationNames} 
                        />
                      </div>
                      {prescriptionData.investigations.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removePrescriptionField('investigations', i)} 
                          className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Remove investigation"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button 
                type="submit" 
                className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                Save Prescription
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DiagnosisPrescription;