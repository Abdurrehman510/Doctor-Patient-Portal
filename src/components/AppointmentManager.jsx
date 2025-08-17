import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

// Modal for requesting a NEW appointment
const AppointmentRequestModal = ({ isOpen, onClose, onSubmit }) => {
    const [requestedDate, setRequestedDate] = useState('');
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!requestedDate) {
            toast.error("Please select a date and time.");
            return;
        }
        onSubmit({ requestedDate, message });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Request an Appointment</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Date & Time</label>
                        <input
                            type="datetime-local"
                            value={requestedDate}
                            onChange={(e) => setRequestedDate(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Note (Optional)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows="3"
                            placeholder="Reason for your visit..."
                            className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Send Request</button>
                </div>
            </div>
        </div>
    );
};

// NEW: Modal for requesting to RESCHEDULE an existing appointment
const RescheduleModal = ({ isOpen, onClose, onSubmit, appointment }) => {
    const [requestedDate, setRequestedDate] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (appointment) {
            setRequestedDate(moment(appointment.start).add(1, 'day').format('YYYY-MM-DDTHH:mm'));
        }
    }, [appointment]);

    if (!isOpen || !appointment) return null;

    const handleSubmit = () => {
        if (!requestedDate) {
            toast.error("Please select a new date and time.");
            return;
        }
        onSubmit({ appointmentId: appointment.id, requestedDate, message });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Request to Reschedule</h3>
                <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
                    Current time: <strong>{moment(appointment.start).format('lll')}</strong>
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Preferred Date & Time</label>
                        <input
                            type="datetime-local"
                            value={requestedDate}
                            onChange={(e) => setRequestedDate(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Note for Doctor (Optional)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows="3"
                            placeholder="Reason for rescheduling..."
                            className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Send Reschedule Request</button>
                </div>
            </div>
        </div>
    );
};

const AppointmentManager = ({ patientId }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required.');
      const res = await axios.get('http://localhost:5000/api/patient/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(
        res.data.map((appt) => ({
          id: appt._id,
          title: `Appointment with Dr. ${appt.doctorId?.name || 'Unknown'}`,
          start: new Date(appt.date),
          end: new Date(new Date(appt.date).getTime() + 30 * 60 * 1000),
          status: appt.status || 'Scheduled',
        }))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestSubmit = async ({ requestedDate, message }) => {
    try {
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/chat/request-appointment', 
            { requestedDate, message },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Appointment request sent to your doctor's chat!");
        setIsRequestModalOpen(false);
    } catch (err) {
        toast.error(err.response?.data?.message || 'Could not send appointment request.');
    }
  };

  const handleRescheduleSubmit = async ({ appointmentId, requestedDate, message }) => {
      try {
          const token = localStorage.getItem('token');
          await axios.post('http://localhost:5000/api/chat/request-reschedule', 
              { appointmentId, requestedDate, message },
              { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success("Reschedule request sent to your doctor's chat!");
          setIsRescheduleModalOpen(false);
          setSelectedAppointment(null);
      } catch (err) {
          toast.error(err.response?.data?.message || 'Could not send reschedule request.');
      }
  };

  const handleSelectEvent = (event) => {
      setSelectedAppointment(event);
      setIsRescheduleModalOpen(true);
  };

  return (
    <>
      <AppointmentRequestModal 
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleRequestSubmit}
      />
      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        onSubmit={handleRescheduleSubmit}
        appointment={selectedAppointment}
      />
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your Appointments</h3>
            <button 
                onClick={() => setIsRequestModalOpen(true)}
                className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Request New Appointment
            </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Click on an existing appointment in the calendar to request a reschedule.</p>
        
        {loading ? (
          <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <Calendar
              localizer={localizer}
              events={appointments}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              className="rbc-calendar"
              onSelectEvent={handleSelectEvent}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default AppointmentManager;
