import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const PatientDetails = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const res = await axios.get(`http://localhost:5000/api/doctor/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched patient:', res.data);
        setPatient(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient:', err.message);
        toast.error(err.response?.data?.message || 'Error fetching patient details');
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!patient) {
    return <div className="text-red-500 text-center">Patient not found</div>;
  }

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4 dark:text-white">{patient.name}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">Email: {patient.email}</p>
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold dark:text-white">Diagnosis</h4>
          <ul className="list-disc pl-5">
            {patient.diagnosis.length ? (
              patient.diagnosis.map((diag, index) => (
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
            {patient.prescriptions.length ? (
              patient.prescriptions.map((pres, index) => (
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
            {patient.reports.length ? (
              patient.reports.map((report, index) => (
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

export default PatientDetails;