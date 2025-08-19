import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FiUser, FiMail, FiCalendar, FiFileText, FiPieChart, 
  FiFile, FiDownload, FiPlus, FiActivity, FiAlertCircle, FiEdit 
} from 'react-icons/fi';
import EditPatientProfile from './EditPatientProfile'; // Import the new component

const PatientProfile = ({ patientId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [isEditModalOpen, setEditModalOpen] = useState(false); // State for modal

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required. Please log in.');
      const res = await axios.get('http://localhost:5000/api/patient/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err.message);
      toast.error(err.response?.data?.message || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile); // Update state with new data from modal
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <FiAlertCircle className="text-red-500 text-4xl mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Profile Not Found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We couldn't find your profile information. Please try again later.
          </p>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    {isEditModalOpen && (
        <EditPatientProfile
          profile={profile}
          onClose={() => setEditModalOpen(false)}
          onProfileUpdate={handleProfileUpdate}
          userRole="Patient"
        />
      )}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Patient Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
              {profile.name.charAt(0)}
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {profile.name}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <FiMail className="text-gray-500 dark:text-gray-400" />
                <span>{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.doctorId?.name && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiUser className="text-gray-500 dark:text-gray-400" />
                  <span>Doctor: {profile.doctorId.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
              onClick={() => setEditModalOpen(true)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2"
            >
              <FiEdit size={16} />
              Edit Profile
            </button>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2">
            <FiPlus size={16} />
            New Appointment
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiUser className="text-blue-500 dark:text-blue-400" />
              Patient Summary
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                <p className="font-medium">
                  {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Blood Type</p>
                <p className="font-medium">{profile.bloodType || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allergies</p>
                <p className="font-medium">
                  {profile.allergies?.length ? (
                    <span className="inline-flex flex-wrap gap-1">
                      {profile.allergies.map(allergy => (
                        <span key={allergy} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full text-xs">
                          {allergy}
                        </span>
                      ))}
                    </span>
                  ) : 'None reported'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Conditions</p>
                <p className="font-medium">
                  {profile.chronicConditions?.length ? (
                    <span className="inline-flex flex-wrap gap-1">
                      {profile.chronicConditions.map(condition => (
                        <span key={condition} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                          {condition}
                        </span>
                      ))}
                    </span>
                  ) : 'None reported'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiActivity className="text-green-500 dark:text-green-400" />
              Health Stats
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Checkup</p>
                <p className="font-medium">
                  {profile.lastCheckup ? new Date(profile.lastCheckup).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Diagnoses</p>
                <p className="font-medium">{profile.diagnosis?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Prescriptions</p>
                <p className="font-medium">{profile.prescriptions?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('diagnosis')}
              className={`flex items-center gap-2 py-3 px-4 font-medium text-sm ${
                activeTab === 'diagnosis' 
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FiFileText className="text-lg" />
              Diagnosis
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`flex items-center gap-2 py-3 px-4 font-medium text-sm ${
                activeTab === 'prescriptions' 
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FiFile className="text-lg" />
              Prescriptions
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 py-3 px-4 font-medium text-sm ${
                activeTab === 'reports' 
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FiDownload className="text-lg" />
              Reports
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'diagnosis' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    Medical Diagnosis History
                  </h3>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {profile.diagnosis && profile.diagnosis.length > 0 ? (
                    profile.diagnosis.map((diag) => (
                      <div key={diag._id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {new Date(diag.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                            {diag.doctorId?.name || 'Unknown Doctor'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Clinical Findings
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              {diag.clinicalFindings.map((finding, i) => (
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
                              {diag.diagnosis.map((diagItem, i) => (
                                <li key={i} className="text-gray-700 dark:text-gray-300">
                                  {diagItem}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Treatment Plan
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              {diag.plan.map((planItem, i) => (
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
                    <div className="text-center py-8">
                      <FiFileText className="mx-auto text-gray-400 dark:text-gray-500 text-4xl mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No diagnosis records found for this patient.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    Prescription History
                  </h3>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {profile.prescriptions && profile.prescriptions.length > 0 ? (
                    profile.prescriptions.map((pres) => (
                      <div key={pres._id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {new Date(pres.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                            {pres.doctorId?.name || 'Unknown Doctor'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              Medications
                            </p>
                            <ul className="space-y-2">
                              {pres.medicines.map((med, i) => (
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
                              Investigations Ordered
                            </p>
                            {pres.investigations.length > 0 ? (
                              <ul className="space-y-2">
                                {pres.investigations.map((inv, i) => (
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
                    <div className="text-center py-8">
                      <FiFile className="mx-auto text-gray-400 dark:text-gray-500 text-4xl mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No prescription history found for this patient.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    Medical Reports
                  </h3>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    Upload New
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.reports && profile.reports.length > 0 ? (
                    profile.reports.map((report, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                            <FiDownload className="text-blue-500 dark:text-blue-400 text-xl" />
                          </div>
                          <div>
                            <p className="font-medium">Report {index + 1}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date().toLocaleDateString()} {/* Replace with actual report date if available */}
                            </p>
                            <a 
                              href={`http://localhost:5000${report}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                            >
                              <FiDownload size={14} /> Download
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <FiFile className="mx-auto text-gray-400 dark:text-gray-500 text-4xl mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No medical reports available for this patient.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default PatientProfile;