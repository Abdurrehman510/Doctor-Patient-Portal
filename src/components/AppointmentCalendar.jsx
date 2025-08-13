import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');
const localizer = momentLocalizer(moment);

const AppointmentCalendar = ({ doctorId }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/doctor/appointments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(
          res.data.map((appt) => ({
            id: appt._id,
            title: `Appointment with ${appt.patientId?.name || 'Unknown'}`,
            start: new Date(appt.date),
            end: new Date(new Date(appt.date).getTime() + 30 * 60 * 1000),
            status: appt.status || 'Scheduled',
            notes: appt.notes,
          }))
        );
        setLoading(false);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        toast.error('Failed to load appointments');
        setLoading(false);
      }
    };
    fetchAppointments();

    socket.on('appointmentApproved', (appointment) => {
      setAppointments((prev) => [
        ...prev,
        {
          id: appointment._id,
          title: `Appointment with ${appointment.patientId?.name || 'Unknown'}`,
          start: new Date(appointment.date),
          end: new Date(new Date(appointment.date).getTime() + 30 * 60 * 1000),
          status: 'Scheduled',
          notes: appointment.notes,
        },
      ]);
      toast.success('Appointment approved: ' + moment(appointment.date).format('MMMM Do YYYY, h:mm a'));
    });

    socket.on('appointmentCancelled', (appointment) => {
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointment._id ? { ...appt, status: 'Cancelled' } : appt
        )
      );
      toast.info('Appointment cancelled: ' + moment(appointment.date).format('MMMM Do YYYY, h:mm a'));
    });

    return () => {
      socket.off('appointmentApproved');
      socket.off('appointmentCancelled');
    };
  }, []);

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4 dark:text-white">Appointment Calendar</h3>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      ) : (
        <Calendar
          localizer={localizer}
          events={appointments}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 400 }}
          className="rbc-calendar"
          eventPropGetter={(event) => ({
            className: event.status === 'Cancelled' ? 'rbc-event cancelled' : 'rbc-event',
          })}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar;