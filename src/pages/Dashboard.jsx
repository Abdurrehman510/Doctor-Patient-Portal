// frontend/src/App.jsx or frontend/src/pages/Dashboard.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Extract token from URL query
    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    if (token) {
      // Store token in localStorage or context
      localStorage.setItem('token', token);

      // Verify token with backend (optional)
      axios
        .get('http://localhost:5000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          // Assuming response contains user data
          console.log('User:', response.data);
          // Clear query params from URL
          navigate('/dashboard', { replace: true });
        })
        .catch((err) => {
          console.error('Token verification failed:', err);
          navigate('/login');
        });
    }
  }, [location, navigate]);

  return (
    <div>
      <h1>Doctor-Patient Portal Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
}

export default Dashboard;