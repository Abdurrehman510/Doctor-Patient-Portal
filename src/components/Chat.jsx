import { useState, useEffect, useRef, useContext } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';

const CounterProposalModal = ({ isOpen, onClose, onSubmit }) => {
    const [newDate, setNewDate] = useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Propose New Time</h3>
                <input
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                    <button onClick={() => onSubmit(newDate)} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Send Proposal</button>
                </div>
            </div>
        </div>
    );
}

// REMOVED: onNewMessage prop is no longer needed here
const Chat = ({ recipientId, recipientName }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCounterModalOpen, setCounterModalOpen] = useState(false);
  const [counteringMessageId, setCounteringMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user && user.id) {
        const newSocket = io("http://localhost:5000", { query: { userId: user.id } });
        setSocket(newSocket);
    return () => newSocket.close();
    }
  }, [user.id]);

  useEffect(() => {
    if (socket) {
      // This component now only needs to worry about updating its own message list
      const handleReceiveMessage = (message) => {
        setMessages((prev) => [...prev, message]);
      };
      
      const handleRequestUpdated = (updatedMsg) => {
        setMessages(prev => prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));
      };

      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('requestUpdated', handleRequestUpdated);
      
      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('requestUpdated', handleRequestUpdated);
      };
    }
  }, [socket]);

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
    if (recipientId) fetchMessages();
  }, [recipientId, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      const messageData = { senderId: user.id, receiverId: recipientId, message: newMessage };
      socket.emit('sendMessage', messageData);
      setMessages((prev) => [...prev, { ...messageData, timestamp: new Date(), _id: Date.now() }]);
      setNewMessage('');
    }
  };

  const handleRequestResponse = (messageId, status) => {
    socket.emit('updateAppointmentRequest', { messageId, status, senderId: user.id, receiverId: recipientId });
  };

  const openCounterModal = (messageId) => {
      setCounteringMessageId(messageId);
      setCounterModalOpen(true);
  };
  
  const handleCounterSubmit = (newDate) => {
      if(!newDate) return toast.error("Please select a new date.");
      socket.emit('counterAppointmentRequest', {
          originalMessageId: counteringMessageId,
          newDate,
          senderId: user.id,
          receiverId: recipientId
      });
      setCounterModalOpen(false);
      setCounteringMessageId(null);
  };

  const renderMessageContent = (msg) => {
    const isRequest = ['appointment_request', 'appointment_counter', 'appointment_reschedule_request'].includes(msg.messageType);
    const isMyRequest = msg.senderId === user.id;

    if (['appointment_response', 'appointment_reschedule_notification'].includes(msg.messageType)) {
        return (
            <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-lg text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold text-sm mb-1">System Notification</p>
                <p>{msg.message}</p>
            </div>
        );
    }

    if (isRequest) {
        let title = 'Appointment Request';
        if (msg.messageType === 'appointment_counter') title = 'Counter Proposal';
        if (msg.messageType === 'appointment_reschedule_request') title = 'Reschedule Request';

        return (
            <div className="bg-gray-100 dark:bg-gray-600 p-3 rounded-lg text-gray-800 dark:text-white">
                <p className="font-semibold text-sm mb-2">{title}</p>
                <p className="italic">"{msg.message}"</p>
                {msg.requestedDate && <p className="font-bold text-sm mt-2">Proposed: {moment(msg.requestedDate).format('lll')}</p>}
                
                {msg.status === 'pending' && !isMyRequest && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-300 dark:border-gray-500">
                        <button onClick={() => handleRequestResponse(msg._id, 'accepted')} className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded">Accept</button>
                        <button onClick={() => openCounterModal(msg._id)} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded">Counter</button>
                    </div>
                )}
                {msg.status !== 'pending' && (
                    <p className={`text-xs font-bold mt-2 uppercase ${msg.status === 'accepted' ? 'text-green-500' : msg.status === 'countered' ? 'text-yellow-500' : 'text-red-500'}`}>
                        {msg.status}
                    </p>
                )}
            </div>
        );
    }
    return <p>{msg.message}</p>;
  };

  return (
    <>
        <CounterProposalModal isOpen={isCounterModalOpen} onClose={() => setCounterModalOpen(false)} onSubmit={handleCounterSubmit} />
        <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Chat with {recipientName}</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg) => (
                <div key={msg._id || msg.timestamp} className={`flex my-2 ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-md ${msg.senderId === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    {renderMessageContent(msg)}
                    <span className="text-xs opacity-75 block text-right mt-1">{moment(msg.timestamp).format('LT')}</span>
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
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Type a message..."
                />
                <button onClick={handleSendMessage} className="ml-4 px-6 py-3 bg-blue-600 text-white rounded-lg">Send</button>
                </div>
            </div>
        </div>
    </>
  );
};

export default Chat;
