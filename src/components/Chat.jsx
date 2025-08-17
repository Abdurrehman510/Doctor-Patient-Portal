import { useState, useEffect, useRef, useContext } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Chat = ({ recipientId, recipientName }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      query: { userId: user.id },
    });
    setSocket(newSocket);

    return () => newSocket.close();
  }, [user.id]);

  useEffect(() => {
    if (socket) {
      socket.on('receiveMessage', (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
        if (document.hidden) { // Basic notification if tab is not active
            toast.info(`New message from ${recipientName}`);
        }
      });

      socket.on('requestUpdated', (updatedMessage) => {
        setMessages(prev => prev.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg));
        if (user.role === 'Patient') {
            toast.success("An appointment request was updated!");
        }
      });
    }

    return () => {
        if(socket) {
            socket.off('receiveMessage');
            socket.off('requestUpdated');
        }
    }
  }, [socket, recipientName, user.role]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/chat/${user.id}/${recipientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    if (recipientId) {
      fetchMessages();
    }
  }, [recipientId, user.id]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      const messageData = {
        senderId: user.id,
        receiverId: recipientId,
        message: newMessage,
      };
      socket.emit('sendMessage', messageData);
      setMessages((prevMessages) => [...prevMessages, { ...messageData, timestamp: new Date(), _id: Date.now() }]);
      setNewMessage('');
    }
  };

  const handleRequestResponse = (messageId, status) => {
      socket.emit('updateAppointmentRequest', {
          messageId,
          status,
          senderId: user.id, // The doctor
          receiverId: recipientId // The patient
      });
  };

  const renderMessageContent = (msg) => {
    if (msg.messageType === 'appointment_request') {
      return (
        <div className="bg-gray-100 dark:bg-gray-600 p-3 rounded-lg">
          <p className="font-semibold text-sm mb-2 text-gray-800 dark:text-white">Appointment Request</p>
          <p className="italic text-gray-700 dark:text-gray-200">"{msg.message}"</p>
          {user.role === 'Doctor' && msg.status === 'pending' && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-300 dark:border-gray-500">
              <button onClick={() => handleRequestResponse(msg._id, 'accepted')} className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded">Accept</button>
              <button onClick={() => handleRequestResponse(msg._id, 'denied')} className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded">Deny</button>
            </div>
          )}
          {msg.status !== 'pending' && (
              <p className={`text-xs font-bold mt-2 uppercase ${msg.status === 'accepted' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  Request {msg.status}
              </p>
          )}
        </div>
      );
    }
    return <p>{msg.message}</p>;
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">Chat with {recipientName}</h3>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => (
            <div key={msg._id || index} className={`flex my-2 ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg max-w-md ${msg.senderId === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'}`}>
                {renderMessageContent(msg)}
                <span className="text-xs opacity-75 block text-right mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Type a message..."
            />
            <button
                onClick={handleSendMessage}
                className="ml-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex-shrink-0"
            >
                Send
            </button>
            </div>
        </div>
    </div>
  );
};

export default Chat;