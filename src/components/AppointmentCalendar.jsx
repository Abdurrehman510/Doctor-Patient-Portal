import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

// A simple Modal component for rescheduling
const RescheduleModal = ({ event, onClose, onReschedule, onDelete }) => {
  const [newDate, setNewDate] = useState(moment(event.start).format('YYYY-MM-DDTHH:mm'));

  if (!event) return null;

  const handleReschedule = () => {
    if (moment(newDate).isBefore(moment())) {
      toast.error("Cannot reschedule to a past date.");
      return;
    }
    onReschedule(event.id, newDate);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4 dark:text-white">Manage Appointment</h3>
        <p className="dark:text-gray-300 mb-2">
          <strong>Patient:</strong> {event.title.replace('Appointment with ', '')}
        </p>
        <p className="dark:text-gray-300 mb-4">
          <strong>Current Time:</strong> {moment(event.start).format('MMMM Do YYYY, h:mm a')}
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Appointment Time
            </label>
            <input
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex justify-between items-center mt-6">
            <button onClick={handleReschedule} className="btn-primary">
              Reschedule
            </button>
            <button onClick={handleDelete} className="btn-danger">
              Delete Appointment
            </button>
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentCalendar = ({ doctorId }) => {
  const [events, setEvents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({ patientId: '', date: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/doctor/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(
        res.data.map((appt) => ({
          id: appt._id,
          title: `Appointment with ${appt.patientId?.name || 'Unknown'}`,
          start: new Date(appt.date),
          end: new Date(new Date(appt.date).getTime() + 30 * 60 * 1000),
          allDay: false,
        }))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch appointments');
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required. Please log in.');
        const [patientsRes, appointmentsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/doctor/patients', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/doctor/appointments', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setPatients(patientsRes.data || []);
        setEvents(
          appointmentsRes.data.map((appt) => ({
            id: appt._id,
            title: `Appointment with ${appt.patientId?.name || 'Unknown'}`,
            start: new Date(appt.date),
            end: new Date(new Date(appt.date).getTime() + 30 * 60 * 1000),
            allDay: false,
          }))
        );
      } catch (err) {
        console.error('Error fetching data:', err.message);
        toast.error(err.response?.data?.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required. Please log in.');
      await axios.post('http://localhost:5000/api/doctor/appointments', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Appointment scheduled successfully!');
      setFormData({ patientId: '', date: '', notes: '' });
      fetchAppointments(); // Refetch to update the calendar
    } catch (err) {
      console.error('Error scheduling appointment:', err.message);
      toast.error(err.response?.data?.message || 'Error scheduling appointment');
    }
  };

  const handleReschedule = async (appointmentId, newDate) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/doctor/appointments/${appointmentId}`, { date: newDate }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Appointment rescheduled successfully!');
      fetchAppointments(); // Refetch to update the calendar
    } catch (err) {
      console.error('Error rescheduling appointment:', err.message);
      toast.error(err.response?.data?.message || 'Failed to reschedule.');
    }
  };

  const handleDelete = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/doctor/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Appointment deleted successfully!');
      fetchAppointments(); // Refetch to update the calendar
    } catch (err) {
      console.error('Error deleting appointment:', err.message);
      toast.error(err.response?.data?.message || 'Failed to delete appointment.');
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="card">
      {selectedEvent && (
        <RescheduleModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onReschedule={handleReschedule}
          onDelete={handleDelete}
        />
      )}
      <h3 className="text-xl font-semibold mb-4 dark:text-white">Schedule & Manage Appointments</h3>
      {loading ? (
        <div className="flex justify-center"><div className="spinner"></div></div>
      ) : (
        <>
          <form onSubmit={handleSchedule} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="input"
                required
              >
                <option value="">Select Patient</option>
                {patients.length > 0 ? (
                  patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} ({patient.email})
                    </option>
                  ))
                ) : (
                  <option disabled>No patients available</option>
                )}
              </select>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input"
                required
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary mt-4">
              Schedule Appointment
            </button>
          </form>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Click on an existing appointment to reschedule or delete it.</p>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            className="rbc-calendar"
            onSelectEvent={handleSelectEvent}
          />
        </>
      )}
    </div>
  );
};

export default AppointmentCalendar;