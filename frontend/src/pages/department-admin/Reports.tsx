import React from 'react';
import Button from '../../components/ui/button/Button';

const Reports: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Generate Reports</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex items-center space-x-4">
          {/* Add report generation controls here, e.g., date pickers, filters */}
          <Button>Generate Report</Button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
