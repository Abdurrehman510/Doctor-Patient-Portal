import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUser(res.data);
          setAuthError(null);
        })
        .catch((err) => {
          console.error('Error fetching user:', err.response?.data?.message || err.message);
          localStorage.removeItem('token');
          setAuthError('Session expired. Please log in again.');
          toast.error('Session expired. Please log in again.', {
            toastId: 'session-expired',
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setAuthError(null);
      toast.success('Logged in successfully!', {
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
      });
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setAuthError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name, role) => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/auth/signup', { 
        email, 
        password, 
        name, 
        role 
      });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setAuthError(null);
      toast.success('Account created successfully!', {
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
      });
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Signup failed';
      setAuthError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully!', {
      position: 'top-center',
      autoClose: 1500,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'colored',
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      authError,
      setAuthError,
      login, 
      signup, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};