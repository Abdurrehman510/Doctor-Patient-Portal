import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

// Setup Axios interceptor to automatically handle token refreshes
const setupAxiosInterceptors = (logout) => {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            logout();
            return Promise.reject(error);
          }

          const res = await axios.post('http://localhost:5000/api/auth/refresh', { refreshToken });
          const { accessToken } = res.data;
          
          localStorage.setItem('token', accessToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          
          return axios(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed", refreshError);
          logout();
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    toast.info('You have been logged out.');
  };

  useEffect(() => {
    setupAxiosInterceptors(logout);

    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          // ### FIX: Ensure the user object has a consistent 'id' property ###
          setUser({ ...res.data, id: res.data.id || res.data._id });
          setAuthError(null);
        })
        .catch((err) => {
          console.error('Error fetching user:', err.response?.data?.message || err.message);
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
      localStorage.setItem('refreshToken', res.data.refreshToken);
      setUser(res.data.user);
      setAuthError(null);
      toast.success('Logged in successfully!');
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setAuthError(errorMessage);
      toast.error(errorMessage);
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
      localStorage.setItem('refreshToken', res.data.refreshToken);
      setUser(res.data.user);
      setAuthError(null);
      toast.success('Account created successfully!');
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Signup failed';
      setAuthError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
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