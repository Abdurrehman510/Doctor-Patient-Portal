import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PatientProfile = ({ patientId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required. Please log in.');
        const res = await axios.get('http://localhost:5000/api/patient/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched profile:', res.data);
        setProfile(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err.message);
        toast.error(err.response?.data?.message || 'Error fetching profile');
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-red-500 text-center">Profile not found</div>;
  }

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4 dark:text-white">Patient Profile</h3>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600 dark:text-gray-300">
            <strong>Name:</strong> {profile.name}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            <strong>Email:</strong> {profile.email}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            <strong>Assigned Doctor:</strong> {profile.doctorId?.name || 'Not assigned'}
          </p>
        </div>
        <div>
          <h4 className="text-lg font-semibold dark:text-white">Diagnosis</h4>
          <ul className="list-disc pl-5">
            {profile.diagnosis.length ? (
              profile.diagnosis.map((diag, index) => (
                <li key={index} className="text-gray-600 dark:text-gray-300">{diag}</li>
              ))
            ) : (
              <li className="text-gray-600 dark:text-gray-300">No diagnosis available</li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold dark:text-white">Prescriptions</h4>
          <ul className="list-disc pl-5">
            {profile.prescriptions.length ? (
              profile.prescriptions.map((pres, index) => (
                <li key={index} className="text-gray-600 dark:text-gray-300">{pres}</li>
              ))
            ) : (
              <li className="text-gray-600 dark:text-gray-300">No prescriptions available</li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold dark:text-white">Reports</h4>
          <ul className="list-disc pl-5">
            {profile.reports.length ? (
              profile.reports.map((report, index) => (
                <li key={index} className="text-gray-600 dark:text-gray-300">
                  <a href={report} className="text-blue-500 hover:underline">Report {index + 1}</a>
                </li>
              ))
            ) : (
              <li className="text-gray-600 dark:text-gray-300">No reports available</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;