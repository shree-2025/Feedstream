import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Mock data for staff dashboard
const staffStats = {
  totalStudents: 45,
  pendingLogs: 12,
  approvedLogs: 157,
  activitiesSubmitted: 23,
};

const StaffDashboard: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Chart for Student Log Submissions
  const logSubmissionsOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      background: 'transparent',
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
    colors: ['#3B82F6'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#6B7280',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Log Submissions',
        style: {
          color: isDark ? '#9CA3AF' : '#6B7280',
        },
      },
    },
    grid: {
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
    },
  };

  const logSubmissionsSeries = [
    {
      name: 'Logs Submitted',
      data: [30, 40, 45, 50, 49, 60],
    },
  ];

  // Chart for Log Status Distribution
  const logStatusOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 350,
      background: 'transparent',
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
    colors: ['#10B981', '#F59E0B', '#EF4444'],
    labels: ['Approved', 'Pending', 'Rejected'],
    legend: {
      position: 'bottom',
      labels: {
        colors: isDark ? '#9CA3AF' : '#6B7280',
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  };

  const logStatusSeries = [157, 12, 5];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} title="Total Students" value={staffStats.totalStudents} />
        <StatCard icon={Clock} title="Pending Logs" value={staffStats.pendingLogs} />
        <StatCard icon={CheckCircle} title="Approved Logs" value={staffStats.approvedLogs} />
        <StatCard icon={FileText} title="Activities Submitted" value={staffStats.activitiesSubmitted} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student Log Submissions</h3>
          <Chart options={logSubmissionsOptions} series={logSubmissionsSeries} type="bar" height={350} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Log Status Distribution</h3>
          <Chart options={logStatusOptions} series={logStatusSeries} type="donut" height={350} />
        </div>
      </div>
    </div>
  );
};

// Reusable StatCard component
interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number | string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <Icon className="w-12 h-12 text-blue-500" />
    </div>
  );
};

export default StaffDashboard;
