import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PatientProfile = ({ patientId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required. Please log in.');
      const res = await axios.get('http://localhost:5000/api/patient/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err.message);
      toast.error(err.response?.data?.message || 'Error fetching profile');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
        <div className="text-red-500 text-lg font-medium">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
              {profile.name.charAt(0)}
            </div>
          </div>
          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{profile.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">Email:</span> {profile.email}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Doctor:</span> {profile.doctorId?.name || 'Not assigned'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Diagnosis Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Medical Diagnosis
            </h4>
            <ul className="space-y-2">
              {profile.diagnosis.length ? (
                profile.diagnosis.map((diag, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="mt-1 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                    <span>{diag}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 dark:text-gray-400 italic">No diagnosis available</li>
              )}
            </ul>
          </div>
          
          {/* Prescriptions Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Prescriptions
            </h4>
            <ul className="space-y-2">
              {profile.prescriptions.length ? (
                profile.prescriptions.map((pres, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="mt-1 w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                    <span>{pres}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 dark:text-gray-400 italic">No prescriptions available</li>
              )}
            </ul>
          </div>
          
          {/* Reports Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 md:col-span-2">
            <h4 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Medical Reports
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.reports.length ? (
                profile.reports.map((report, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium">Report {index + 1}</p>
                        <a 
                          href={report} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Report
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 dark:text-gray-400 italic">No reports available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;