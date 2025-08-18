import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PatientProfile from '../components/PatientProfile';
import AppointmentManager from '../components/AppointmentManager';
import ReportUpload from '../components/ReportUpload';
import Chat from '../components/Chat';
import TabPanel from '../components/TabPanel';
import {
  UserIcon,
  CalendarIcon,
  DocumentArrowUpIcon,
  ChatBubbleBottomCenterTextIcon
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
      label: 'Upload Report',
      icon: <DocumentArrowUpIcon className="w-5 h-5" />,
      content: <ReportUpload patientId={user?.id} />
    },
    {
      label: 'Chat with Doctor',
      icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />,
      content: profile?.doctorId ? <Chat recipientId={profile.doctorId._id} recipientName={`Dr. ${profile.doctorId.name}`} /> : <p>You are not assigned to a doctor yet.</p>,
    }
  ];

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Welcome back, <span className="text-blue-600 dark:text-blue-400">{user?.name}</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              View your health records, manage appointments, and chat with your doctor.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <TabPanel tabs={tabs} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PatientDashboard;