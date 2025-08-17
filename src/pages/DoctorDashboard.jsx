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
} from '@heroicons/react/24/outline';
import axios from 'axios';
import io from 'socket.io-client';

const DoctorDashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

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
                toast.error("Could not load patient list.");
            }
          }
      };
      fetchPatients();
  }, [user]);

  useEffect(() => {
      if(!user) return;
      const socket = io('http://localhost:5000', { query: { userId: user.id } });
      
      const handleReceiveMessage = (message) => {
          if (message.senderId !== user.id && message.senderId !== activeChat?.id) {
            setUnreadCounts(prev => ({...prev, [message.senderId]: (prev[message.senderId] || 0) + 1 }));
            toast.info(`New message from a patient!`);
          }
      };
      
      socket.on('receiveMessage', handleReceiveMessage);
      
      return () => {
          socket.off('receiveMessage', handleReceiveMessage);
          socket.close();
      };
  }, [user, activeChat]);

  useEffect(() => {
      setTotalUnread(Object.values(unreadCounts).reduce((sum, count) => sum + count, 0));
  }, [unreadCounts]);
  
  const handleSelectChat = (patient) => {
      setActiveChat({ id: patient.userId, name: patient.name });
      setUnreadCounts(prev => ({...prev, [patient.userId]: 0}));
  };

  const handleNewMessage = (senderId) => {
      if (senderId !== user.id && senderId !== activeChat?.id) {
          setUnreadCounts(prev => ({...prev, [senderId]: (prev[senderId] || 0) + 1 }));
      }
  };

  const PatientChatList = () => (
    <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Patient Conversations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-700 h-[600px] overflow-y-auto">
                <ul className="space-y-1 pr-4">
                    {patients.map(p => (
                        <li key={p.userId}>
                            <button onClick={() => handleSelectChat(p)} className={`w-full flex justify-between items-center text-left p-3 rounded-lg transition-colors ${activeChat?.id === p.userId ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <span>{p.name}</span>
                                {unreadCounts[p.userId] > 0 && <span className="bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">{unreadCounts[p.userId]}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="md:col-span-2">
                {activeChat ? <Chat recipientId={activeChat.id} recipientName={activeChat.name} onNewMessage={handleNewMessage} /> : <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-700/30 rounded-lg"><p className="text-gray-500">Select a patient to view messages.</p></div>}
            </div>
        </div>
    </div>
  );

  const tabs = [
    { label: 'Patients', icon: <UserGroupIcon className="w-5 h-5" />, content: <PatientList doctorId={user?.id} /> },
    { label: 'Appointments', icon: <CalendarIcon className="w-5 h-5" />, content: <AppointmentCalendar doctorId={user?.id} /> },
    { label: 'Messages', icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />, content: <PatientChatList />, notification: totalUnread }
  ];

  if (loading) { return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>; }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
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
