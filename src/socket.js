import { io } from 'socket.io-client';

// The URL of your backend server
const URL = 'http://localhost:5000';

// Create and export a single socket instance
// autoConnect: false prevents it from connecting automatically on app load
export const socket = io(URL, { autoConnect: false });