import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PatientProfile from '../components/PatientProfile';
import AppointmentManager from '../components/AppointmentManager';
import ChatRoom from '../components/ChatRoom';
import ReportUpload from '../components/ReportUpload';

const PatientDashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [patientProfile, setPatientProfile] = useState(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Patient')) {
      toast.error('Access denied. Patients only.');
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/patient/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPatientProfile(res.data);
      } catch (err) {
        console.error('Error fetching patient profile:', err);
        toast.error('Failed to load patient profile');
      }
    };
    if (user) {
      fetchPatientProfile();
    }
  }, [user]);

  if (loading || !patientProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="text-2xl font-bold mb-8 dark:text-white sm:text-lg md:text-2xl">
          Patient Dashboard
        </h2>
        <nav>
          <button className="sidebar-item" onClick={() => navigate('/patient')}>
            Profile
          </button>
          <button className="sidebar-item" onClick={() => navigate('/patient')}>
            Appointments
          </button>
          <button className="sidebar-item" onClick={() => navigate('/patient')}>
            Chat
          </button>
          <button className="sidebar-item" onClick={() => navigate('/patient')}>
            Upload Report
          </button>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 ml-64 sm:ml-20 md:ml-64">
        <Header />
        <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl dark:text-white">Welcome, {user?.name}</h2>
            <p className="text-gray-600 dark:text-gray-300">View your health records and manage appointments.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PatientProfile patientId={user?.id} />
            <AppointmentManager patientId={user?.id} doctorId={patientProfile?.doctorId?._id} />
            <ChatRoom room={{ patientId: user?.id, doctorId: patientProfile?.doctorId?._id }} />
            <ReportUpload patientId={user?.id} />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default PatientDashboard;