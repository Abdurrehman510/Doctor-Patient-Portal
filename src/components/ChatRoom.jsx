import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { toast } from 'react-toastify';

const ChatRoom = ({ room }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // This effect now correctly depends on the 'room' prop.
    // It will re-run ONLY when the room object itself changes.
    if (!room || !room.patientId || !room.doctorId) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('joinRoom', room);

    const onReceiveMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };
    socket.on('receiveMessage', onReceiveMessage);

    const onAppointmentApproved = (appointment) => {
      toast.success(`Appointment approved: ${new Date(appointment.date).toLocaleString()}`);
    };
    socket.on('appointmentApproved', onAppointmentApproved);

    const onAppointmentRejected = ({ date }) => {
      toast.error(`Appointment request rejected: ${new Date(date).toLocaleString()}`);
    };
    socket.on('appointmentRejected', onAppointmentRejected);

    const onError = ({ message: errorMessage }) => {
      toast.error(errorMessage);
    };
    socket.on('error', onError);

    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/chat/${room.patientId}/${room.doctorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else if (res.status !== 404) {
          throw new Error('Failed to fetch chat history');
        }
      } catch (err) {
        toast.error(err.message);
      }
    };
    fetchChatHistory();

    // Cleanup function
    return () => {
      socket.emit('leaveRoom', room);
      socket.off('receiveMessage', onReceiveMessage);
      socket.off('appointmentApproved', onAppointmentApproved);
      socket.off('appointmentRejected', onAppointmentRejected);
      socket.off('error', onError);
    };
  }, [room]); // Dependency array ensures this runs when room details are ready

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() && room) {
      socket.emit('sendMessage', { room, sender: 'Patient', content: message });
      setMessage('');
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4 dark:text-white">Chat with Doctor</h3>
      <div className="h-64 overflow-y-scroll mb-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 flex ${msg.sender === 'Patient' ? 'justify-end' : 'justify-start'}`}>
            <div className={`chat-bubble ${msg.sender === 'Patient' ? 'chat-bubble-patient' : 'chat-bubble-doctor'}`}>
              <p>{msg.content}</p>
              <p className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
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
    </div>
  );
};

export default ChatRoom;