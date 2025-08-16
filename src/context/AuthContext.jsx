import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { socket } from '../socket'; // Import the shared socket instance

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUser(res.data);
          socket.connect(); 
        })
        .catch((err) => {
          console.error('Error fetching user:', err.response?.data?.message || err.message);
          localStorage.removeItem('token');
          toast.error('Session expired. Please log in again.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      socket.connect();
      toast.success('Logged in successfully!');
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const signup = async (email, password, name, role) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', { email, password, name, role });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      socket.connect();
      toast.success('Signed up successfully!');
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Signup failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    socket.disconnect();
    toast.success('Logged out successfully!');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};