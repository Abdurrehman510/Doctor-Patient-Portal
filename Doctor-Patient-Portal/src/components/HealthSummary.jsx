// File: src/components/HealthSummary.jsx

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiCpu, FiAlertTriangle, FiActivity, FiHelpCircle, FiFileText } from 'react-icons/fi';

const HealthSummary = ({ patientId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/analysis/health-summary/${patientId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(res.data);
      toast.success('Analysis complete!');
    } catch (err) {
      console.error('Error analyzing health data:', err);
      const errorMessage = err.response?.data?.message || 'Failed to generate health summary.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI-Powered Clinical Summary</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Analyzes the full patient record for key insights.</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <FiCpu />
              Generate Summary
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center gap-3">
          <FiAlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {summary && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 animate-fade-in space-y-6">
          {/* Overall Summary */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <FiFileText className="text-blue-500" />
              Overall Summary
            </h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{summary.overallSummary}</p>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Symptoms */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <FiActivity className="text-red-500" />
                Key Symptoms (from chat)
              </h4>
              {summary.keySymptoms && summary.keySymptoms.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 pl-2">
                  {summary.keySymptoms.map((item, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-300 text-sm">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No specific symptoms extracted from recent chat.</p>
              )}
            </div>

            {/* Potential Risks */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <FiAlertTriangle className="text-yellow-500" />
                Potential Risks & Considerations
              </h4>
              {summary.potentialRisks && summary.potentialRisks.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 pl-2">
                  {summary.potentialRisks.map((item, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-300 text-sm">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No specific risks identified.</p>
              )}
            </div>
          </div>

          {/* Follow-up Questions */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <FiHelpCircle className="text-green-500" />
              Suggested Follow-up Questions
            </h4>
            {summary.followUpQuestions && summary.followUpQuestions.length > 0 ? (
              <ul className="space-y-2">
                {summary.followUpQuestions.map((item, index) => (
                  <li key={index} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200 text-sm">"{item}"</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No questions suggested.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthSummary;
