import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PatientList from '../components/PatientList';
import AppointmentCalendar from '../components/AppointmentCalendar';
import Chat from '../components/Chat';
import TabPanel from '../components/TabPanel';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  ChatBubbleBottomCenterTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const DoctorDashboard = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [patients, setPatients] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // Stores { id, name } of the patient

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Doctor')) {
      toast.error('Access denied. Doctors only.');
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);
  
  useEffect(() => {
      const fetchPatients = async () => {
          if (user) {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/doctor/patients', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPatients(res.data || []);
            } catch(err) {
                console.error("Failed to fetch patients for chat list");
                toast.error("Could not load patient list for messaging.");
            }
          }
      };
      fetchPatients();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // You could add logic here to refetch data for all tabs if needed
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // This is a sub-component rendered inside the "Messages" tab
  const PatientChatList = () => (
    <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Patient Conversations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-700 h-[600px] overflow-y-auto">
                <p className="text-sm text-gray-500 dark:text-gray-400 px-4 pb-2">Select a patient to view messages</p>
                <ul className="space-y-1 pr-4">
                    {patients.length > 0 ? patients.map(p => (
                        <li key={p.userId}>
                            <button 
                                onClick={() => setActiveChat({ id: p.userId, name: p.name })} 
                                className={`w-full text-left p-3 rounded-lg transition-colors ${activeChat?.id === p.userId ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                {p.name}
                            </button>
                        </li>
                    )) : <p className="p-4 text-gray-500">No patients assigned.</p>}
                </ul>
            </div>
            <div className="md:col-span-2">
                {activeChat ? (
                    <Chat recipientId={activeChat.id} recipientName={activeChat.name} />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">Select a patient to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );

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
      label: 'Messages',
      icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />,
      content: <PatientChatList />
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
            {/* ... (Header section of the dashboard remains the same) ... */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold dark:text-white">
                Welcome, <span className="text-blue-600 dark:text-blue-400">Dr. {user?.name}</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <TabPanel tabs={tabs} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DoctorDashboard;