import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PatientList from '../components/PatientList';
import AppointmentCalendar from '../components/AppointmentCalendar';
import DoctorChatRoom from '../components/DoctorChatRoom';
import TabPanel from '../components/TabPanel';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/outline';

const DoctorDashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Doctor')) {
      toast.error('Access denied. Doctors only.');
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  const tabs = [
    {
      label: 'Patients',
      icon: <UserGroupIcon className="w-5 h-5" />,
      content: <PatientList doctorId={user?.id} />
    },
    {
      label: 'Appointments',
      icon: <CalendarIcon className="w-5 h-5" />,
      content: <AppointmentCalendar doctorId={user?.id} />
    },
    {
      label: 'Chat',
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
      content: <DoctorChatRoom doctorId={user?.id} />
    }
  ];

  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  if (loading) {
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
              Welcome, Dr. {user?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your patients and appointments efficiently.
            </p>
          </div>
          
          <TabPanel tabs={tabs} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DoctorDashboard;