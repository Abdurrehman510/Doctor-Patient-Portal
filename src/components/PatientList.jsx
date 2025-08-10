import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const PatientList = ({ doctorId }) => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ email: '', name: '' });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required. Please log in.');
        }
        const res = await axios.get('http://localhost:5000/api/doctor/patients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched patients:', res.data);
        setPatients(res.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patients:', err.message);
        toast.error(err.response?.data?.message || 'Error fetching patients');
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required. Please log in.');
      await axios.post('http://localhost:5000/api/doctor/patients', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Patient added successfully');
      setFormData({ email: '', name: '' });
      const res = await axios.get('http://localhost:5000/api/doctor/patients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(res.data || []);
    } catch (err) {
      console.error('Error adding patient:', err.message);
      toast.error(err.response?.data?.message || 'Error adding patient');
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      (patient.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (patient.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4 dark:text-white">Manage Patients</h3>
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input mb-4"
      />
      <form onSubmit={handleAddPatient} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Patient Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            required
          />
          <input
            type="email"
            placeholder="Patient Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input"
            required
          />
        </div>
        <button type="submit" className="btn-primary mt-4">
          Add Patient
        </button>
      </form>
      {loading ? (
        <div className="flex justify-center">
          <div className="spinner"></div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">No patients found</p>
      ) : (
        <ul className="space-y-3">
          {filteredPatients.map((patient) => (
            <li
              key={patient._id}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
            >
              <Link to={`/patient/${patient._id}`} className="text-blue-500 hover:underline">
                {patient.name} ({patient.email})
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PatientList;