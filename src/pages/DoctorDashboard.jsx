import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PatientList from '../components/PatientList';
import AppointmentCalendar from '../components/AppointmentCalendar';

const DoctorDashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Doctor')) {
      toast.error('Access denied. Doctors only.');
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="text-2xl font-bold mb-8 dark:text-white">Doctor Dashboard</h2>
        <nav className="space-y-2">
          <button className="sidebar-item" onClick={() => navigate('/doctor')}>
            Patients
          </button>
          <button className="sidebar-item" onClick={() => navigate('/doctor')}>
            Appointments
          </button>
          <button className="sidebar-item" onClick={() => navigate('/doctor')}>
            Chat
          </button>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl dark:text-white">Welcome, Dr. {user?.name}</h2>
            <p className="text-gray-600 dark:text-gray-300">Manage your patients and appointments efficiently.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PatientList doctorId={user?.id} />
            <AppointmentCalendar doctorId={user?.id} />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DoctorDashboard;