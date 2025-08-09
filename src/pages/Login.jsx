import { useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, user, setUser, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate(user.role === 'Doctor' ? '/doctor' : user.role === 'Admin' ? '/admin' : '/patient', { replace: true });
      return;
    }

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userData = params.get('user');
    const error = params.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      toast.error(`Authentication failed: ${error}`);
      navigate('/login', { replace: true });
      return;
    }

    if (token && userData) {
      try {
        console.log('Raw userData:', userData);
        const parsedUser = JSON.parse(decodeURIComponent(userData));
        console.log('Parsed user:', parsedUser);
        localStorage.setItem('token', token);
        setUser(parsedUser);
        toast.success('Logged in with Google!');
        navigate(parsedUser.role === 'Doctor' ? '/doctor' : parsedUser.role === 'Admin' ? '/admin' : '/patient', { replace: true });
      } catch (err) {
        console.error('Error processing Google login:', err.message);
        toast.error(`Failed to process Google login: ${err.message}`);
        navigate('/login', { replace: true });
      }
    }
  }, [location, navigate, setUser, user, loading]);

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full overflow-x-hidden">
      <Header />
      <main className="pt-16 flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">Login</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>
            <button
              type="submit"
              className="w-full p-3 bg-primary text-white rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <a
              href="http://localhost:5000/api/auth/google"
              className="inline-block p-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Login with Google
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;