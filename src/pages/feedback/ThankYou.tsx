import React from 'react';
import { Link, useParams } from 'react-router-dom';

const ThankYou: React.FC = () => {
  const { slug } = useParams();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank you for your feedback!</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Your response has been submitted successfully.</p>
        <div className="flex items-center justify-center gap-3">
          <Link to={`/feedback/${encodeURIComponent(slug || '')}`} className="text-sm text-blue-600 hover:text-blue-800">Go back</Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
