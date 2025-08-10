import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { toast } from 'react-toastify';

const localizer = momentLocalizer(moment);

const AppointmentCalendar = ({ doctorId }) => {
  const [events, setEvents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({ patientId: '', date: '', notes: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
        console.log('Fetched patients:', patientsRes.data);
        console.log('Fetched appointments:', appointmentsRes.data);
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
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err.message);
        toast.error(err.response?.data?.message || 'Error fetching data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required. Please log in.');
      await axios.post('http://localhost:5000/api/doctor/appointments', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Appointment scheduled');
      setFormData({ patientId: '', date: '', notes: '' });
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
      console.error('Error scheduling appointment:', err.message);
      toast.error(err.response?.data?.message || 'Error scheduling appointment');
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4 dark:text-white">Schedule Appointments</h3>
      {loading ? (
        <div className="flex justify-center">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <form onSubmit={handleSchedule} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            className="rbc-calendar"
          />
        </>
      )}
    </div>
  );
};

export default AppointmentCalendar;