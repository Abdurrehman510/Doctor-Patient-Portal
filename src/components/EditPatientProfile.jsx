import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import axios from 'axios';

const EditPatientProfile = ({ profile, onClose, onProfileUpdate, userRole }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      dob: '',
      gender: '',
      phone: '',
      bloodType: '',
      allergies: '',
      chronicConditions: '',
      lastCheckup: ''
    }
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
        gender: profile.gender || '',
        phone: profile.phone || '',
        bloodType: profile.bloodType || '',
        allergies: profile.allergies?.join(', ') || '',
        chronicConditions: profile.chronicConditions?.join(', ') || '',
        lastCheckup: profile.lastCheckup ? new Date(profile.lastCheckup).toISOString().split('T')[0] : ''
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...data,
        allergies: data.allergies.split(',').map(item => item.trim()).filter(Boolean),
        chronicConditions: data.chronicConditions.split(',').map(item => item.trim()).filter(Boolean),
      };
      
      // Remove empty date fields to avoid sending empty strings to the backend
      if (!payload.dob) delete payload.dob;
      if (!payload.lastCheckup) delete payload.lastCheckup;


      let response;
      if (userRole === 'Patient') {
        response = await axios.put('http://localhost:5000/api/patient/profile', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (userRole === 'Doctor') {
        response = await axios.put(`http://localhost:5000/api/doctor/patients/${profile._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      onProfileUpdate(response.data);
      toast.success('Profile updated successfully!');
      onClose();
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h3>
          </div>
          
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input {...register('name', { required: 'Name is required' })} className="mt-1 block w-full input" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                <input {...register('phone')} type="tel" className="mt-1 block w-full input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                <input {...register('dob')} type="date" className="mt-1 block w-full input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                <select {...register('gender')} className="mt-1 block w-full input">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Blood Type</label>
                <input {...register('bloodType')} className="mt-1 block w-full input" placeholder="e.g., O+" />
              </div>
              {userRole === 'Doctor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Checkup Date</label>
                  <input {...register('lastCheckup')} type="date" className="mt-1 block w-full input" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Allergies (comma-separated)</label>
              <textarea {...register('allergies')} rows="2" className="mt-1 block w-full input" placeholder="e.g., Peanuts, Pollen"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chronic Conditions (comma-separated)</label>
              <textarea {...register('chronicConditions')} rows="2" className="mt-1 block w-full input" placeholder="e.g., Asthma, Hypertension"></textarea>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/30 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatientProfile;