import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { toast } from 'react-toastify';
import axios from 'axios';

const DoctorChatRoom = ({ doctorId }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [appointmentRequest, setAppointmentRequest] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/doctor/patients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPatients(res.data);
        if (res.data.length > 0) {
          setSelectedPatient(res.data[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load patients');
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatient || !doctorId) return;

    if (!socket.connected) {
      socket.connect();
    }

    const newRoom = { patientId: selectedPatient, doctorId };
    socket.emit('joinRoom', newRoom);

    const onReceiveMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };
    socket.on('receiveMessage', onReceiveMessage);

    const onAppointmentRequest = (request) => {
      setAppointmentRequest(request);
      toast.info('New appointment request received');
    };
    socket.on('appointmentRequest', onAppointmentRequest);

    const onError = ({ message }) => {
      toast.error(message);
    };
    socket.on('error', onError);

    const fetchChatHistory = async () => {
      setMessages([]);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/chat/${selectedPatient}/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) {
          setMessages(res.data);
        }
      } catch (err) {
        if (err.response && err.response.status !== 404) {
          console.error('Error fetching chat history:', err);
          toast.error('Failed to load chat history');
        }
      }
    };
    fetchChatHistory();

    return () => {
      socket.emit('leaveRoom', newRoom);
      socket.off('receiveMessage', onReceiveMessage);
      socket.off('appointmentRequest', onAppointmentRequest);
      socket.off('error', onError);
    };
  }, [selectedPatient, doctorId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() && currentRoom) {
      socket.emit('sendMessage', {
        room: currentRoom,
        sender: 'Doctor',
        content: message,
      });
      setMessage('');
    }
  };

  const approveAppointment = () => {
    if (selectedPatient) {
      socket.emit('approveAppointment', {
        room: { patientId: selectedPatient, doctorId },
        date: appointmentRequest.date,
        notes: appointmentRequest.notes,
      });
      setAppointmentRequest(null);
      toast.success('Appointment approved');
    }
  };

  const rejectAppointment = () => {
    if (selectedPatient) {
      socket.emit('rejectAppointment', {
        room: { patientId: selectedPatient, doctorId },
        date: appointmentRequest.date,
        notes: appointmentRequest.notes,
      });
      setAppointmentRequest(null);
      toast.error('Appointment rejected');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Chat with Patient</h3>
        
        <div className="mb-6">
          <label htmlFor="patient-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Patient
          </label>
          <select
            id="patient-select"
            value={selectedPatient || ''}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            title="Select a patient to chat with"
          >
            <option value="" disabled>Select a patient</option>
            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>
        
        {selectedPatient && (
          <>
            <div className="h-96 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 mb-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`mb-4 flex ${msg.sender === 'Doctor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs md:max-w-md rounded-xl p-4 ${msg.sender === 'Doctor' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {appointmentRequest && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 animate-pulse">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Appointment Request</h4>
                  <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                    New
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">
                  <span className="font-medium">Date:</span> {new Date(appointmentRequest.date).toLocaleString()}
                </p>
                {appointmentRequest.notes && (
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-3">
                    <span className="font-medium">Notes:</span> {appointmentRequest.notes}
                  </p>
                )}
                <div className="flex gap-3">
                  <button 
                    onClick={approveAppointment}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                  <button 
                    onClick={rejectAppointment}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                placeholder="Type your message..."
              />
              <button 
                onClick={sendMessage}
                disabled={!message.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorChatRoom;