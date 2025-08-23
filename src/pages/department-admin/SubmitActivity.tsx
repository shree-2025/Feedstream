import React from 'react';
import Button from '../../components/ui/button/Button';

const SubmitActivity: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Submit Activity</h1>
      <form className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div>
          <label htmlFor="activityTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Activity Title</label>
          <input
            type="text"
            id="activityTitle"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Weekly Report Submission"
          />
        </div>
        <div>
          <label htmlFor="activityDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            id="activityDescription"
            rows={6}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Provide a detailed description of the activity..."
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload File (Optional)</label>
          <input 
            type="file" 
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"/>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Submit Activity</Button>
        </div>
      </form>
    </div>
  );
};

export default SubmitActivity;
