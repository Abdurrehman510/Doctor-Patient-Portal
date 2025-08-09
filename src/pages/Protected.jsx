import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Protected = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please log in to access this page');
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full overflow-x-hidden">
      <Header />
      <main className="pt-16 flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">
            Welcome, {user?.name} ({user?.role})
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            This is a protected page accessible only to authenticated {user?.role} users.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Protected;