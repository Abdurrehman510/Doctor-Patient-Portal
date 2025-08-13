import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import axios from 'axios';

const ReportUpload = ({ patientId }) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('report', acceptedFiles[0]);
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/patient/upload-report', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success(res.data.message);
    } catch (err) {
      console.error('Error uploading report:', err);
      toast.error(err.response?.data?.message || 'Error uploading report');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4 dark:text-white">Upload Report</h3>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">
            Drag & drop a PDF or image, or click to select (max 5MB)
          </p>
        )}
      </div>
    </div>
  );
};

export default ReportUpload;