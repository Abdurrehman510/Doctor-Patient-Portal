import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Appointment</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Patient</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {event.title.replace('Appointment with ', '')}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Time</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {moment(event.start).format('MMMM Do YYYY, h:mm a')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Appointment Time
              </label>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/30 px-6 py-4 flex justify-between border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Reschedule
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
      fetchAppointments();
    } catch (err) {
      if (err.response && err.response.status === 409) {
        toast.error('This time slot is already booked.');
      } else {
        console.error('Error scheduling appointment:', err.message);
        toast.error(err.response?.data?.message || 'Error scheduling appointment');
      }
    }
  };

  const handleReschedule = async (appointmentId, newDate) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/doctor/appointments/${appointmentId}`, { date: newDate }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Appointment rescheduled successfully!');
      fetchAppointments();
    } catch (err) {
      if (err.response && err.response.status === 409) {
        toast.error('This time slot is already booked.');
      } else {
        console.error('Error rescheduling appointment:', err.message);
        toast.error(err.response?.data?.message || 'Failed to reschedule.');
      }
    }
  };

  const handleDelete = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/doctor/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Appointment deleted successfully!');
      fetchAppointments();
    } catch (err) {
      console.error('Error deleting appointment:', err.message);
      toast.error(err.response?.data?.message || 'Failed to delete appointment.');
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      {selectedEvent && (
        <RescheduleModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onReschedule={handleReschedule}
          onDelete={handleDelete}
        />
      )}

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule & Manage Appointments</h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSchedule} className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Patient</label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
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
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                  <input
                    type="text"
                    placeholder="Optional notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schedule Appointment
              </button>
            </form>

            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Click on an appointment to reschedule or delete it.
                </span>
              </p>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                className="rbc-calendar"
                onSelectEvent={handleSelectEvent}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentCalendar;