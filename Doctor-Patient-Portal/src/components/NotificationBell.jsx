import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import moment from 'moment';

const NotificationBell = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        if (user && user.id) {
        const socket = io("http://localhost:5000", { query: { userId: user.id } });

        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/notifications', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNotifications(res.data);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };
        fetchNotifications();

        socket.on('newNotification', (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
        });

            return () => socket.close();
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = async (notif) => {
        try {
            if (!notif.read) {
                const token = localStorage.getItem('token');
                await axios.put(`http://localhost:5000/api/notifications/${notif._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNotifications(notifications.map(n => n._id === notif._id ? { ...n, read: true } : n));
            }
            if (notif.link) navigate(notif.link);
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to handle notification click", error);
        }
    };

    const handleDeleteNotification = async (notifId, e) => {
        e.stopPropagation(); // Prevent the click from propagating to the notification body
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/notifications/${notifId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.filter(n => n._id !== notifId));
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
             console.error("Failed to mark all as read", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 justify-center items-center text-white text-[10px]">{unreadCount}</span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-20">
                    <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
                        <p className="font-bold">Notifications</p>
                        {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">Mark all as read</button>}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-sm text-gray-500 text-center">You're all caught up!</p>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif._id} onClick={() => handleNotificationClick(notif)} className={`flex items-start gap-3 p-3 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                    <div className="w-10 h-10 flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                        <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{notif.title}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{moment(notif.createdAt).fromNow()}</p>
                                    </div>
                                    <button onClick={(e) => handleDeleteNotification(notif._id, e)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                        <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;