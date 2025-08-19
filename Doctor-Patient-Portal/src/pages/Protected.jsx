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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="pt-20 pb-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-center">
            <h2 className="text-2xl font-bold text-white">Welcome back!</h2>
          </div>
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {user?.name} <span className="text-blue-600 dark:text-blue-400">({user?.role})</span>
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This is a protected page accessible only to authenticated {user?.role} users.
            </p>
            <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You have successfully authenticated as a {user?.role}.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Protected;