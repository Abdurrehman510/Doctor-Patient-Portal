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
import TabPanel from '../components/TabPanel';
import {
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

const PatientDashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Patient')) {
      toast.error('Access denied. Patients only.');
      navigate('/login', { replace: true });
    }

    const fetchProfile = async () => {
      if (user) {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:5000/api/patient/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProfile(res.data);
        } catch (err) {
          console.error('Error fetching profile:', err);
          toast.error('Failed to load profile');
        } finally {
          setProfileLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user, loading, navigate]);

  const tabs = [
    {
      label: 'Profile',
      icon: <UserIcon className="w-5 h-5" />,
      content: <PatientProfile patientId={user?.id} />
    },
    {
      label: 'Appointments',
      icon: <CalendarIcon className="w-5 h-5" />,
      content: <AppointmentManager patientId={user?.id} />
    },
    {
      label: 'Chat',
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
      content: (profile && profile.doctorId)
        ? <ChatRoom room={{ patientId: user?.id, doctorId: profile.doctorId?._id }} />
        : <p className="text-center text-gray-500">You are not assigned to a doctor yet. Please contact support.</p>
    },
    {
      label: 'Upload Report',
      icon: <DocumentArrowUpIcon className="w-5 h-5" />,
      content: <ReportUpload patientId={user?.id} />
    }
  ];

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold dark:text-white">
              Welcome, {user?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              View your health records and manage appointments.
            </p>
          </div>
          <TabPanel tabs={tabs} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PatientDashboard;