import { useState, useEffect, useRef, useContext } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const CounterProposalModal = ({ isOpen, onClose, onSubmit }) => {
    const [newDate, setNewDate] = useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-2xl transform transition-all duration-300 scale-95 hover:scale-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Propose New Time</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Select Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            onClick={onClose} 
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onSubmit(newDate)} 
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                        >
                            Send Proposal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Chat = ({ recipientId, recipientName }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCounterModalOpen, setCounterModalOpen] = useState(false);
  const [counteringMessageId, setCounteringMessageId] = useState(null);
  const [editingMessage, setEditingMessage] = useState({ id: null, content: '' });
  const messagesEndRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (user && user.id) {
        const newSocket = io("http://localhost:5000", { query: { userId: user.id } });
        setSocket(newSocket);
        return () => newSocket.close();
    }
  }, [user.id]);

  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (message) => setMessages((prev) => {
          if (!prev.find(m => m._id === message._id)) {
            return [...prev, message];
          }
          return prev;
      });
      const handleRequestUpdated = (updatedMsg) => setMessages(prev => prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));
      const handleMessageDeleted = (data) => setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      
      const handleMessageEdited = ({ updatedMessage }) => {
        setMessages(prev => prev.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg));
        setEditingMessage({ id: null, content: '' });
      };

      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('requestUpdated', handleRequestUpdated);
      socket.on('messageDeleted', handleMessageDeleted);
      socket.on('messageEdited', handleMessageEdited);
      
      return () => {
        socket.off('receiveMessage');
        socket.off('requestUpdated');
        socket.off('messageDeleted');
        socket.off('messageEdited');
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

  useEffect(() => {
    if (editingMessage.id && editInputRef.current) {
        editInputRef.current.focus();
    }
  }, [editingMessage.id]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      const messageData = { senderId: user.id, receiverId: recipientId, message: newMessage };
      socket.emit('sendMessage', messageData);
      setNewMessage('');
    }
  };

  const handleRequestResponse = (messageId, status) => {
    setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, status: status } : msg
    ));
    socket.emit('updateAppointmentRequest', { messageId, status, senderId: user.id, receiverId: recipientId });
  };

  const handleDeleteMessage = (message) => {
    const isRequest = ['appointment_request', 'appointment_counter', 'appointment_reschedule_request'].includes(message.messageType);
    const confirmText = isRequest
        ? 'Are you sure you want to cancel this appointment request?'
        : 'Are you sure you want to delete this message? This cannot be undone.';
    
    if (window.confirm(confirmText)) {
        socket.emit('deleteMessage', { messageId: message._id, senderId: user.id, receiverId: recipientId });
    }
  };

  const handleEditClick = (message) => {
    setEditingMessage({ id: message._id, content: message.message });
  };

  const handleCancelEdit = () => {
    setEditingMessage({ id: null, content: '' });
  };
  
  const handleSaveEdit = () => {
    if (editingMessage.content.trim() === '') return;
    socket.emit('editMessage', {
        messageId: editingMessage.id,
        newContent: editingMessage.content,
        senderId: user.id,
        receiverId: recipientId,
    });
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
    const isRequest = ['appointment_request', 'appointment_counter', 'appointment_reschedule_request', 'appointment_cancellation_request'].includes(msg.messageType);
    
    if (['appointment_response', 'appointment_cancellation_response'].includes(msg.messageType)) {
        return (
             <div className="bg-gray-100 dark:bg-gray-600 p-3 rounded-lg text-gray-800 dark:text-white">
                <p className="font-semibold text-sm mb-1 text-blue-600 dark:text-blue-400">System Notification</p>
                <p>{msg.message}</p>
            </div>
        );
    }

    if (isRequest) {
        let title = 'Appointment Request';
        if (msg.messageType === 'appointment_counter') title = 'Counter Proposal';
        if (msg.messageType === 'appointment_reschedule_request') title = 'Reschedule Request';
        if (msg.messageType === 'appointment_cancellation_request') title = 'Cancellation Request';

        return (
            <div className="bg-gray-100 dark:bg-gray-600 p-4 rounded-lg text-gray-800 dark:text-white w-full border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-sm mb-2 text-blue-600 dark:text-blue-400">{title}</p>
                <p className="italic mb-3">"{msg.message}"</p>
                {msg.requestedDate && (
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                            {moment(msg.requestedDate).format('lll')}
                        </span>
                    </div>
                )}
                
                {msg.status === 'pending' && msg.senderId !== user.id && (
                    <div className="flex gap-3 mt-4 pt-4 border-t border-gray-300 dark:border-gray-500">
                        <button 
                            onClick={() => handleRequestResponse(msg._id, 'accepted')} 
                            className="flex-1 text-sm bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg transition-colors"
                        >
                            Accept
                        </button>
                        {msg.messageType !== 'appointment_cancellation_request' && (
                            <button 
                                onClick={() => openCounterModal(msg._id)} 
                                className="flex-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded-lg transition-colors"
                            >
                                Counter
                            </button>
                        )}
                        <button 
                            onClick={() => handleRequestResponse(msg._id, 'denied')} 
                            className="flex-1 text-sm bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg transition-colors"
                        >
                            Deny
                        </button>
                    </div>
                )}
                {msg.status !== 'pending' && (
                    <div className={`mt-3 pt-3 border-t border-gray-300 dark:border-gray-500 text-sm font-medium ${
                        msg.status === 'accepted' ? 'text-green-600' : 
                        msg.status === 'countered' ? 'text-yellow-500' : 
                        'text-red-500'
                    }`}>
                        Status: <span className="uppercase">{msg.status}</span>
                    </div>
                )}
            </div>
        );
    }
    return (
        <div className="flex flex-col">
            <p className="break-words">{msg.message}</p>
            {msg.isEdited && (
                <span className="text-xs opacity-70 italic self-end pt-1">
                    (edited)
                </span>
            )}
        </div>
    )
  };

  return (
    <>
        <CounterProposalModal 
            isOpen={isCounterModalOpen} 
            onClose={() => setCounterModalOpen(false)} 
            onSubmit={handleCounterSubmit} 
        />
        
        <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-gray-50 dark:bg-gray-900">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {recipientName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">Chat with {recipientName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {messages.length > 0 ? 
                            `Last message: ${moment(messages[messages.length-1].timestamp).fromNow()}` : 
                            'Start a new conversation'}
                    </p>
                </div>
            </div>
            
            {/* Messages area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 space-y-3">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <div className="w-16 h-16 mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <PaperAirplaneIcon className="w-8 h-8 transform rotate-45" />
                        </div>
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg._id || msg.timestamp} 
                            className={`group flex my-1 items-end gap-2 ${
                                msg.senderId === user.id ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            <div className={`flex items-center gap-2 ${
                                msg.senderId === user.id ? 'flex-row-reverse' : 'flex-row'
                            }`}>
                                {/* Message actions */}
                                {msg.messageType === 'text' && msg.senderId === user.id && (
                                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-y-1">
                                        <button 
                                            onClick={() => handleEditClick(msg)} 
                                            className="text-gray-400 hover:text-blue-500 p-1 transition-colors"
                                            aria-label="Edit message"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteMessage(msg)} 
                                            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                            aria-label="Delete message"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                {msg.messageType !== 'text' && msg.senderId === user.id && msg.status === 'pending' && (
                                    <button 
                                        onClick={() => handleDeleteMessage(msg)} 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-red-500 p-1"
                                        aria-label="Cancel request"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                                
                                {/* Message bubble */}
                                <div className={`p-3 rounded-2xl max-w-xs md:max-w-md shadow-sm transition-all duration-200 ${
                                    msg.senderId === user.id ? 
                                        'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none' : 
                                        'bg-white dark:bg-gray-700 rounded-bl-none border border-gray-200 dark:border-gray-600'
                                }`}>
                                    {editingMessage.id === msg._id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={editInputRef}
                                                type="text"
                                                value={editingMessage.content}
                                                onChange={(e) => setEditingMessage({...editingMessage, content: e.target.value})}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                className="bg-white/20 text-white placeholder-white/50 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-white"
                                                placeholder="Edit message..."
                                            />
                                            <button 
                                                onClick={handleSaveEdit} 
                                                className="text-green-300 hover:text-green-100 transition-colors"
                                                aria-label="Save edit"
                                            >
                                                <CheckIcon className="w-5 h-5"/>
                                            </button>
                                            <button 
                                                onClick={handleCancelEdit} 
                                                className="text-red-300 hover:text-red-100 transition-colors"
                                                aria-label="Cancel edit"
                                            >
                                                <XMarkIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    ) : renderMessageContent(msg)}
                                    
                                    <span className={`text-xs block mt-1 ${
                                        msg.senderId === user.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {moment(msg.timestamp).format('h:mm A')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {/* Message input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Type a message..."
                    />
                    <button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim()}
                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        aria-label="Send message"
                    >
                        <PaperAirplaneIcon className="w-5 h-5 transform rotate-45" />
                    </button>
                </div>
            </div>
        </div>
    </>
  );
};

export default Chat;