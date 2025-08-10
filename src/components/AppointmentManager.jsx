import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

const localizer = momentLocalizer(moment);

const AppointmentManager = ({ patientId }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, setValue } = useForm();
  const [editingAppointment, setEditingAppointment] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required. Please log in.');
        const res = await axios.get('http://localhost:5000/api/patient/appointments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched appointments:', res.data);
        setAppointments(
          res.data.map((appt) => ({
            id: appt._id,
            title: `Appointment with Dr. ${appt.doctorId?.name || 'Unknown'}`,
            start: new Date(appt.date),
            end: new Date(new Date(appt.date).getTime() + 30 * 60 * 1000),
            status: appt.status,
            notes: appt.notes,
          }))
        );
        setLoading(false);
      } catch (err) {
        console.error('Error fetching appointments:', err.message);
        toast.error(err.response?.data?.message || 'Error fetching appointments');
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const onBookAppointment = async (data) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required. Please log in.');
      await axios.post('http://localhost:5000/api/patient/appointments', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Appointment booked successfully');
      reset();
      const res = await axios.get('http://localhost:5000/api/patient/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(
        res.data.map((appt) => ({
          id: appt._id,
          title: `Appointment with Dr. ${appt.doctorId?.name || 'Unknown'}`,
          start: new Date(appt.date),
          end: new Date(new Date(appt.date).getTime() + 30 * 60 * 1000),
          status: appt.status,
          notes: appt.notes,
        }))
      );
    } catch (err) {
      console.error('Error booking appointment:', err.message);
      toast.error(err.response?.data?.message || 'Error booking appointment');
    }
  };

  const onRescheduleAppointment = async (data) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required. Please log in.');
      await axios.put(`http://localhost:5000/api/patient/appointments/${editingAppointment}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Appointment rescheduled successfully');
      reset();
      setEditingAppointment(null);
      const res = await axios.get('http://localhost:5000/api/patient/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(
        res.data.map((appt) => ({
          id: appt._id,
          title: `Appointment with Dr. ${appt.doctorId?.name || 'Unknown'}`,
          start: new Date(appt.date),
          end: new Date(new Date(appt.date).getTime() + 30 * 60 * 1000),
          status: appt.status,
          notes: appt.notes,
        }))
      );
    } catch (err) {
      console.error('Error rescheduling appointment:', err.message);
      toast.error(err.response?.data?.message || 'Error rescheduling appointment');
    }
  };

  const handleCancelAppointment = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required. Please log in.');
      await axios.delete(`http://localhost:5000/api/patient/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Appointment cancelled');
      const res = await axios.get('http://localhost:5000/api/patient/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(
        res.data.map((appt) => ({
          id: appt._id,
          title: `Appointment with Dr. ${appt.doctorId?.name || 'Unknown'}`,
          start: new Date(appt.date),
          end: new Date(new Date(appt.date).getTime() + 30 * 60 * 1000),
          status: appt.status,
          notes: appt.notes,
        }))
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
        <div className="flex justify-center">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <form
            onSubmit={handleSubmit(editingAppointment ? onRescheduleAppointment : onBookAppointment)}
            className="mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="datetime-local"
                {...register('date', { required: 'Date is required' })}
                className="input"
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                {...register('notes')}
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary mt-4">
              {editingAppointment ? 'Reschedule Appointment' : 'Book Appointment'}
            </button>
            {editingAppointment && (
              <button
                type="button"
                onClick={() => {
                  reset();
                  setEditingAppointment(null);
                }}
                className="btn-secondary mt-4 ml-4"
              >
                Cancel Edit
              </button>
            )}
          </form>
          <Calendar
            localizer={localizer}
            events={appointments}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            className="rbc-calendar"
            onSelectEvent={handleSelectEvent}
          />
          <div className="mt-6">
            <h4 className="text-lg font-semibold dark:text-white">Upcoming Appointments</h4>
            <ul className="space-y-3">
              {appointments
                .filter((appt) => appt.status !== 'Cancelled')
                .map((appt) => (
                  <li
                    key={appt.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">{appt.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {moment(appt.start).format('MMMM Do YYYY, h:mm a')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelAppointment(appt.id)}
                      className="btn-danger"
                    >
                      Cancel
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default AppointmentManager;