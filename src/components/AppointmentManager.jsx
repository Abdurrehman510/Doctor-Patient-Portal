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
    <div className="card">
      <h3 className="text-xl font-semibold mb-4 dark:text-white">Manage Appointments</h3>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
          <form
            onSubmit={handleSubmit(editingAppointment ? onRescheduleAppointment : onBookAppointment)}
            className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <input
                type="datetime-local"
                {...register('date', { required: 'Date is required' })}
                className="input"
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Notes (optional)"
                {...register('notes')}
                className="input"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:col-span-2">
              <button type="submit" className="btn-primary">
                {editingAppointment ? 'Request Reschedule' : 'Request Appointment'}
              </button>
              {editingAppointment && (
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setEditingAppointment(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
          <Calendar
            localizer={localizer}
            events={appointments}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 400 }}
            className="rbc-calendar"
            onSelectEvent={handleSelectEvent}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.status === 'Cancelled' ? '#EF4444' : '#10B981',
              },
            })}
          />
          <div className="mt-6">
            <h4 className="text-lg font-semibold dark:text-white">Upcoming Appointments</h4>
            {appointments.filter((appt) => appt.status !== 'Cancelled').length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">No upcoming appointments</p>
            ) : (
              <ul className="space-y-3">
                {appointments
                  .filter((appt) => appt.status !== 'Cancelled')
                  .map((appt) => (
                    <li
                      key={appt.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center transition-all duration-200"
                    >
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">{appt.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {moment(appt.start).format('MMMM Do YYYY, h:mm a')}
                        </p>
                        {appt.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Notes: {appt.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="btn-danger mt-2 sm:mt-0"
                      >
                        Cancel
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManager;