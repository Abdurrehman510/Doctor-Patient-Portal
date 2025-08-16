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

    const room = { patientId: selectedPatient, doctorId };
    socket.emit('joinRoom', room);

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
      socket.emit('leaveRoom', room);
      socket.off('receiveMessage', onReceiveMessage);
      socket.off('appointmentRequest', onAppointmentRequest);
      socket.off('error', onError);
    };
  }, [selectedPatient, doctorId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() && selectedPatient) {
        const room = { patientId: selectedPatient, doctorId };
        socket.emit('sendMessage', {
        room,
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
    <div className="card">
      <h3 className="text-xl font-semibold mb-4 dark:text-white">Chat with Patient</h3>
      <div className="mb-4">
        <label htmlFor="patient-select" className="block text-gray-600 dark:text-gray-300 mb-2">Select Patient</label>
        <select
          id="patient-select"
          value={selectedPatient || ''}
          onChange={(e) => setSelectedPatient(e.target.value)}
          className="input"
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
          <div className="h-64 overflow-y-scroll mb-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-2 flex ${msg.sender === 'Doctor' ? 'justify-end' : 'justify-start'}`}>
                <div className={`chat-bubble ${msg.sender === 'Doctor' ? 'chat-bubble-patient' : 'chat-bubble-doctor'}`}>
                  <p>{msg.content}</p>
                  <p className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {appointmentRequest && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg animate-slide-in">
              <p className="text-gray-800 dark:text-gray-200">
                Appointment Request: {new Date(appointmentRequest.date).toLocaleString()}
              </p>
              <p className="text-gray-600 dark:text-gray-300">Notes: {appointmentRequest.notes}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={approveAppointment} className="btn-success">
                  Approve
                </button>
                <button onClick={rejectAppointment} className="btn-danger">
                  Reject
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="input flex-1"
              placeholder="Type message..."
              title="Chat message input"
            />
            <button onClick={sendMessage} className="btn-primary">
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorChatRoom;