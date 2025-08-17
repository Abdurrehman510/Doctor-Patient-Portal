import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { toast } from 'react-toastify';

const ChatRoom = ({ room }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
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

    const onAppointmentRejected = ({ date, notes }) => {
      toast.error(`Appointment request rejected: ${new Date(date).toLocaleString()}`);
    };
    socket.on('appointmentRejected', onAppointmentRejected);

    const onError = ({ message }) => {
      toast.error(message);
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

    return () => {
      socket.emit('leaveRoom', room);
      socket.off('receiveMessage', onReceiveMessage);
      socket.off('appointmentApproved', onAppointmentApproved);
      socket.off('appointmentRejected', onAppointmentRejected);
      socket.off('error', onError);
    };
  }, [room, socket]);

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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Chat with Doctor</h3>
        
        <div className="h-96 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 mb-6 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={index} 
                className={`mb-4 flex ${msg.sender === 'Patient' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs md:max-w-md rounded-xl p-4 ${msg.sender === 'Patient' 
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
        
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            placeholder="Type your message..."
            title="Chat message input"
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
      </div>
    </div>
  );
};

export default ChatRoom;