import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const AppointmentManager = ({ patientId }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required. Please log in.');
      const appointmentsRes = await axios.get('http://localhost:5000/api/patient/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(
        appointmentsRes.data.map((appt) => ({
          id: appt._id,
          title: `Appointment with Dr. ${appt.doctorId?.name || 'Unknown'}`,
          start: new Date(appt.date),
          end: new Date(new Date(appt.date).getTime() + 30 * 60 * 1000),
          status: appt.status || 'Scheduled',
          notes: appt.notes,
        }))
      );
    } catch (err) {
      console.error('Error fetching appointments:', err.message);
      toast.error(err.response?.data?.message || 'Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestAppointment = async () => {
    if (window.confirm("This will send a formal request to your doctor's chat. Proceed?")) {
        try {
            const token = localStorage.getItem('token');
            const message = "I would like to request a new appointment. Please let me know what time works for you.";
            await axios.post('http://localhost:5000/api/chat/request-appointment', 
                { message },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Appointment request sent successfully via chat!");
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not send appointment request.');
        }
    }
  };
  
  const handleCancelAppointment = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required. Please log in.');
      const res = await axios.delete(`http://localhost:5000/api/patient/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(res.data.message);
      fetchData(); // Refetch to update the list and calendar
    } catch (err) {
      console.error('Error cancelling appointment:', err.message);
      toast.error(err.response?.data?.message || 'Error cancelling appointment');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Appointments</h3>
            <button 
                onClick={handleRequestAppointment}
                className="mt-4 md:mt-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Request New Appointment via Chat
            </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <Calendar
                localizer={localizer}
                events={appointments}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                className="rbc-calendar"
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.status === 'Cancelled' ? '#EF4444' : '#10B981',
                    borderColor: event.status === 'Cancelled' ? '#DC2626' : '#059669',
                    color: 'white',
                  },
                })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentManager;