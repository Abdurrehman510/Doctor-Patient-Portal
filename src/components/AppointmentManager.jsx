import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import io from 'socket.io-client';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const socket = io('http://localhost:5000');
const localizer = momentLocalizer(moment);

const AppointmentManager = ({ patientId }) => {
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required. Please log in.');
        const [profileRes, appointmentsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/patient/profile', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/patient/appointments', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setProfile(profileRes.data);
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
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err.message);
        toast.error(err.response?.data?.message || 'Error fetching data');
        setLoading(false);
      }
    };
    fetchData();

    socket.on('appointmentApproved', (appointment) => {
      setAppointments((prev) => [
        ...prev,
        {
          id: appointment._id,
          title: `Appointment with Dr. ${appointment.doctorId?.name || 'Unknown'}`,
          start: new Date(appointment.date),
          end: new Date(new Date(appointment.date).getTime() + 30 * 60 * 1000),
          status: 'Scheduled',
          notes: appointment.notes,
        },
      ]);
      toast.success('Appointment approved: ' + moment(appointment.date).format('MMMM Do YYYY, h:mm a'));
    });

    return () => {
      socket.off('appointmentApproved');
    };
  }, []);

  const onBookAppointment = (data) => {
    socket.emit('sendMessage', {
      room: { patientId, doctorId: profile?.doctorId?._id },
      sender: 'Patient',
      content: `Book appointment on ${data.date} with notes: ${data.notes || 'No notes'}`,
    });
    toast.info('Appointment request sent to doctor via chat');
    reset();
  };

  const onRescheduleAppointment = (data) => {
    socket.emit('sendMessage', {
      room: { patientId, doctorId: profile?.doctorId?._id },
      sender: 'Patient',
      content: `Reschedule appointment ${editingAppointment} to ${data.date} with notes: ${data.notes || 'No notes'}`,
    });
    toast.info('Reschedule request sent to doctor via chat');
    reset();
    setEditingAppointment(null);
  };

  const handleCancelAppointment = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required. Please log in.');
      const res = await axios.delete(`http://localhost:5000/api/patient/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(res.data.message);
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id ? { ...appt, status: 'Cancelled' } : appt
        )
      );
    } catch (err) {
      console.error('Error cancelling appointment:', err.message);
      toast.error(err.response?.data?.message || 'Error cancelling appointment');
    }
  };

  const handleSelectEvent = (event) => {
    if (event.status !== 'Cancelled') {
      setEditingAppointment(event.id);
      setValue('date', moment(event.start).format('YYYY-MM-DDTHH:mm'));
      setValue('notes', event.notes || '');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Manage Appointments</h3>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <form
              onSubmit={handleSubmit(editingAppointment ? onRescheduleAppointment : onBookAppointment)}
              className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl"
            >
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingAppointment ? 'Reschedule Appointment' : 'Request New Appointment'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    {...register('date', { required: 'Date is required' })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Any special requests or notes"
                    {...register('notes')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {editingAppointment ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Request Reschedule
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Request Appointment
                    </>
                  )}
                </button>
                
                {editingAppointment && (
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setEditingAppointment(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <Calendar
                localizer={localizer}
                events={appointments}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                className="rbc-calendar"
                onSelectEvent={handleSelectEvent}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.status === 'Cancelled' ? '#EF4444' : '#10B981',
                    borderColor: event.status === 'Cancelled' ? '#DC2626' : '#059669',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '4px 8px',
                  },
                })}
              />
            </div>
            
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upcoming Appointments</h4>
              
              {appointments.filter((appt) => appt.status !== 'Cancelled').length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl text-center">
                  <p className="text-gray-500 dark:text-gray-400">No upcoming appointments scheduled</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointments
                    .filter((appt) => appt.status !== 'Cancelled')
                    .sort((a, b) => new Date(a.start) - new Date(b.start))
                    .map((appt) => (
                      <div
                        key={appt.id}
                        className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-semibold text-gray-900 dark:text-white">{appt.title}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {moment(appt.start).format('MMMM Do YYYY, h:mm a')}
                            </p>
                            {appt.notes && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <span className="font-medium">Notes:</span> {appt.notes}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleCancelAppointment(appt.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentManager;