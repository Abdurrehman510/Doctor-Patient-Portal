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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upload Medical Report</h3>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
          }`}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Uploading your file...</p>
            </div>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-500 dark:text-blue-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isDragActive ? 'Drop the file here' : 'Drag & drop your report'}
              </h4>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Supported formats: PDF, JPG, PNG (max 5MB)
              </p>
              
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Select File
              </button>
            </>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>Your medical reports will be securely stored and accessible to your healthcare provider.</p>
        </div>
      </div>
    </div>
  );
};

export default ReportUpload;