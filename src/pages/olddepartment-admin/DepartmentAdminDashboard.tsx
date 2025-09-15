import React from 'react';
import { Users, FileText, Megaphone, CheckCircle } from 'lucide-react';
import ActivityChart from '../../components/charts/ActivityChart';
import StaffDistributionChart from '../../components/charts/StaffDistributionChart';

const DepartmentAdminDashboard: React.FC = () => {
  const recentActivities = [
    { id: 1, user: 'Dr. Evelyn Reed', action: 'approved a patient record', time: '2 hours ago' },
    { id: 2, user: 'Liam Smith', action: 'submitted a new case study', time: '5 hours ago' },
    { id: 3, user: 'Admin', action: 'posted a new department memo', time: '1 day ago' },
    { id: 4, user: 'Nurse Alex Dawson', action: 'updated patient charts', time: '2 days ago' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Department Dashboard</h1>
      </div>

      {/* Statistic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Department Staff</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">15</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Users className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">86</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recent Records</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">58</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
              <Megaphone className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Announcements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart />
        <StaffDistributionChart />
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activities</h3>
        <ul className="space-y-4">
          {recentActivities.map(activity => (
            <li key={activity.id} className="flex items-start space-x-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                <CheckCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">{activity.user}</span> {activity.action}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DepartmentAdminDashboard;
