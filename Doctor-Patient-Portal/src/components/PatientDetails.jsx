import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiFileText, FiPieChart, FiFile, FiCalendar, FiUser, FiMail, FiPhone, FiEdit } from 'react-icons/fi';
import DiagnosisPrescription from './DiagnosisPrescription';
import EditPatientProfile from './EditPatientProfile'; // Import the new component

// UI Components
const Card = ({ children, className = '', ...props }) => (
  <div 
    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    {...props}
  >
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    primary: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
    success: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
    danger: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

const Tabs = ({ children, className = '', ...props }) => (
  <div className={`flex border-b border-gray-200 dark:border-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

// Fixed Tab component
const Tab = ({ children, active = false, icon: Icon, className = '', ...props }) => {
  // Ensure Icon is a valid React component
  const IconComponent = typeof Icon === 'function' ? Icon : null;
  
  return (
    <button
      className={`flex items-center gap-2 py-3 px-4 font-medium text-sm ${
        active 
          ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
      } ${className}`}
      {...props}
    >
      {IconComponent && <IconComponent className="text-lg" />}
      {children}
    </button>
  );
};

const PatientDetails = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setEditModalOpen] = useState(false); // State for modal

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      
      const [patientRes, diagnosesRes, prescriptionsRes, appointmentsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/doctor/patients/${id}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`http://localhost:5000/api/doctor/patients/${id}/diagnosis`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`http://localhost:5000/api/doctor/patients/${id}/prescriptions`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get('http://localhost:5000/api/doctor/appointments', { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
      ]);

      setPatient(patientRes.data);
      setDiagnoses(diagnosesRes.data);
      setPrescriptions(prescriptionsRes.data);
      setAppointments(appointmentsRes.data.filter(appt => appt.patientId?._id === id));
    } catch (err) {
      console.error('Error fetching patient data:', err.message);
      toast.error(err.response?.data?.message || 'Error fetching patient details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleProfileUpdate = (updatedProfile) => {
    setPatient(updatedProfile); // Update state with new data
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="text-center p-8">
        <div className="text-red-500 text-lg font-medium mb-4">Patient not found</div>
        <Link 
          to="/doctor" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <FiArrowLeft /> Back to patients list
        </Link>
      </Card>
    );
  }

  return (
    <>
    {isEditModalOpen && (
        <EditPatientProfile
          profile={patient}
          onClose={() => setEditModalOpen(false)}
          onProfileUpdate={handleProfileUpdate}
          userRole="Doctor"
        />
      )}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Patient Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
            <FiUser className="text-blue-600 dark:text-blue-400 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {patient.name}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <FiMail className="text-gray-500 dark:text-gray-400" />
                <span>{patient.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <FiPhone className="text-gray-500 dark:text-gray-400" />
                <span>{patient.phone || 'No phone number'}</span>
              </div>
              {patient.age && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="text-gray-500 dark:text-gray-400">Age:</span>
                  <span>{patient.age}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <button 
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <FiEdit /> Edit Patient Details
          </button>        
        <Link 
          to="/doctor" 
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <FiArrowLeft /> Back to Patients
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Patient Summary */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiUser /> Patient Summary
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                <p className="font-medium">{patient.gender || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Blood Type</p>
                <p className="font-medium">{patient.bloodType || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allergies</p>
                <p className="font-medium">
                  {patient.allergies?.length ? patient.allergies.join(', ') : 'None reported'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chronic Conditions</p>
                <p className="font-medium">
                  {patient.chronicConditions?.length ? patient.chronicConditions.join(', ') : 'None reported'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiCalendar /> Upcoming Appointments
            </h3>
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.slice(0, 3).map(appt => (
                  <div key={appt._id} className="border-l-4 border-blue-500 pl-3 py-1">
                    <p className="font-medium">
                      {new Date(appt.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {appt.reason || 'No reason specified'}
                    </p>
                  </div>
                ))}
                {appointments.length > 3 && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    + {appointments.length - 3} more appointments
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No upcoming appointments</p>
            )}
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <Tabs>
            <Tab 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')}
              icon={<FiPieChart />}
            >
              Overview
            </Tab>
            <Tab 
              active={activeTab === 'diagnosis'} 
              onClick={() => setActiveTab('diagnosis')}
              icon={<FiFileText />}
            >
              Diagnosis
            </Tab>
            <Tab 
              active={activeTab === 'prescriptions'} 
              onClick={() => setActiveTab('prescriptions')}
              icon={<FiFile />}
            >
              Prescriptions
            </Tab>
          </Tabs>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <>
                <Card className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setActiveTab('diagnosis')}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
                          <FiFileText className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">Add Diagnosis</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Record new clinical findings
                          </p>
                        </div>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('prescriptions')}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                          <FiFile className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium">Create Prescription</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Prescribe medications
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
                    Recent Medical History
                  </h3>
                  <div className="space-y-4">
                    {diagnoses.slice(0, 2).map(d => (
                      <div key={d._id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">
                            {new Date(d.date).toLocaleDateString()}
                          </p>
                          <Badge variant="primary">Diagnosis</Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {d.diagnosis.length > 100 ? `${d.diagnosis.substring(0, 100)}...` : d.diagnosis}
                        </p>
                      </div>
                    ))}
                    {prescriptions.slice(0, 2).map(p => (
                      <div key={p._id} className="border-l-4 border-green-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">
                            {new Date(p.date).toLocaleDateString()}
                          </p>
                          <Badge variant="success">Prescription</Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {p.medicines.map(m => m.name).join(', ')}
                        </p>
                      </div>
                    ))}
                    {(diagnoses.length === 0 && prescriptions.length === 0) && (
                      <p className="text-gray-500 dark:text-gray-400">No recent medical history</p>
                    )}
                  </div>
                </Card>
              </>
            )}

            {activeTab === 'diagnosis' && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-6">
                  Diagnosis Records
                </h3>
                <DiagnosisPrescription 
                  patientId={id} 
                  appointments={appointments} 
                  onNewEntry={fetchData} 
                />
                <div className="mt-8">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    Previous Diagnoses
                  </h4>
                  <div className="space-y-4">
                    {diagnoses.length > 0 ? (
                      diagnoses.map(d => (
                        <div 
                          key={d._id} 
                          className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(d.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <Badge variant="primary">
                              {d.appointmentId ? 'Appointment' : 'Standalone'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Clinical Findings
                              </p>
                              <ul className="list-disc list-inside space-y-1">
                                {d.clinicalFindings.map((finding, i) => (
                                  <li key={i} className="text-gray-700 dark:text-gray-300">
                                    {finding}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Diagnosis
                              </p>
                              <ul className="list-disc list-inside space-y-1">
                                {d.diagnosis.map((diag, i) => (
                                  <li key={i} className="text-gray-700 dark:text-gray-300">
                                    {diag}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Treatment Plan
                              </p>
                              <ul className="list-disc list-inside space-y-1">
                                {d.plan.map((planItem, i) => (
                                  <li key={i} className="text-gray-700 dark:text-gray-300">
                                    {planItem}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">
                        No diagnosis records found for this patient.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'prescriptions' && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-6">
                  Prescription Management
                </h3>
                <DiagnosisPrescription 
                  patientId={id} 
                  appointments={appointments} 
                  onNewEntry={fetchData} 
                />
                <div className="mt-8">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    Prescription History
                  </h4>
                  <div className="space-y-4">
                    {prescriptions.length > 0 ? (
                      prescriptions.map(p => (
                        <div 
                          key={p._id} 
                          className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(p.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <Badge variant="success">
                              {p.appointmentId ? 'Appointment' : 'Standalone'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Medications
                              </p>
                              <ul className="space-y-2">
                                {p.medicines.map((med, i) => (
                                  <li key={i} className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {med.name}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {med.dosage} {med.duration && `for ${med.duration}`}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Investigations
                              </p>
                              {p.investigations.length > 0 ? (
                                <ul className="space-y-2">
                                  {p.investigations.map((inv, i) => (
                                    <li key={i} className="text-gray-700 dark:text-gray-300">
                                      {inv.name}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400">None requested</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">
                        No prescription history found for this patient.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default PatientDetails;