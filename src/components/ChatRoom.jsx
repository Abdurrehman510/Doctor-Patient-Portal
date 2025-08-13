import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const socket = io('http://localhost:5000');

const ChatRoom = ({ room }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit('joinRoom', room);

    socket.on('receiveMessage', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('appointmentApproved', (appointment) => {
      toast.success(`Appointment approved: ${new Date(appointment.date).toLocaleString()}`);
    });

    socket.on('appointmentRejected', ({ date, notes }) => {
      toast.error(`Appointment request rejected: ${new Date(date).toLocaleString()}`);
    });

    socket.on('error', ({ message }) => {
      toast.error(message);
    });

    // Fetch chat history
    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/chat/${room.patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error('Error fetching chat history:', err);
        toast.error('Failed to load chat history');
      }
    };
    fetchChatHistory();

    return () => {
      socket.off('receiveMessage');
      socket.off('appointmentApproved');
      socket.off('appointmentRejected');
      socket.off('error');
    };
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('sendMessage', { room, sender: 'Patient', content: message });
      setMessage('');
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4 dark:text-white">Chat with Doctor</h3>
      <div className="h-64 overflow-y-scroll mb-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 flex ${msg.sender === 'Patient' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`chat-bubble ${
                msg.sender === 'Patient' ? 'chat-bubble-patient' : 'chat-bubble-doctor'
              }`}
            >
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
          placeholder="Type message or appointment request..."
        />
        <button onClick={sendMessage} className="btn-primary">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;