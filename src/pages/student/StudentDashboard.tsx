import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Calendar,
  TrendingUp,
  Eye,
  Megaphone
} from 'lucide-react';
import Button from '../../components/ui/button/Button';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

// Mock data for user statistics
const userStats = {
  totalActivities: 24,
  pendingReview: 3,
  approved: 18,
  rejected: 3,
  thisMonthActivities: 8,
  weeklyAverage: 2.1
};

const recentActivities = [
  { id: 1, title: 'International AI Conference', type: 'Conference', date: '2024-01-15', status: 'approved' },
  { id: 2, title: 'Research Paper on LLMs', type: 'Paper Publication', date: '2024-01-14', status: 'pending' },
  { id: 3, title: 'Advanced React Workshop', type: 'Workshop', date: '2024-01-12', status: 'approved' },
  { id: 4, title: 'Guest Lecture on Quantum Computing', type: 'Seminar', date: '2024-01-10', status: 'rejected' },
  { id: 5, title: 'Project Demo Day', type: 'Other', date: '2024-01-08', status: 'approved' }
];

const mockAnnouncements = [
  { id: 1, title: 'Upcoming System Maintenance', content: 'The system will be down for maintenance on Friday at 10 PM.', date: '2024-02-20' },
  { id: 2, title: 'New Feature: Staff Activity Submission', content: 'Staff can now submit their activities for approval directly through the dashboard.', date: '2024-02-18' },
];

const StudentDashboard: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Chart for submission trends with theme support
  const submissionTrendOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 250,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent'
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    },
    colors: ['#3B82F6'],
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#6B7280'
        }
      },
      axisBorder: {
        color: isDark ? '#374151' : '#E5E7EB'
      },
      axisTicks: {
        color: isDark ? '#374151' : '#E5E7EB'
      }
    },
    yaxis: {
      title: { 
        text: 'Activities Submitted',
        style: {
          color: isDark ? '#9CA3AF' : '#6B7280'
        }
      },
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#6B7280'
        }
      }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#E5E7EB'
    },
    markers: {
      size: 6
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light'
    }
  };

  const submissionTrendSeries = [{
    name: 'Activities Submitted',
    data: [2, 3, 1, 2]
  }];

  // Status distribution chart with theme support
  const statusDistributionOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 250,
      background: 'transparent'
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    },
    colors: ['#10B981', '#F59E0B', '#EF4444'],
    labels: ['Approved', 'Pending', 'Rejected'],
    legend: {
      position: 'bottom',
      labels: {
        colors: isDark ? '#9CA3AF' : '#6B7280'
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              color: isDark ? '#F3F4F6' : '#1F2937'
            },
            value: {
              color: isDark ? '#F3F4F6' : '#1F2937'
            }
          }
        }
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light'
    }
  };

  const statusDistributionSeries = [userStats.approved, userStats.pendingReview, userStats.rejected];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your activity submissions and progress</p>
        </div>
        <Link to="/student/submit-activity">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Submit New Activity
          </Button>
        </Link>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Activities</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.totalActivities}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">{userStats.thisMonthActivities} this month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.pendingReview}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500" />
          </div>
          <div className="mt-4 flex items-center">
            <Calendar className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-sm text-blue-600">Avg. review: 2-3 days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.approved}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <div className="mt-4 flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">{((userStats.approved / userStats.totalActivities) * 100).toFixed(0)}% approval rate</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.rejected}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-sm text-red-600">Review feedback</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Submission Trend</h3>
          <Chart
            options={submissionTrendOptions}
            series={submissionTrendSeries}
            type="line"
            height={250}
          />
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Status Distribution</h3>
          <Chart
            options={statusDistributionOptions}
            series={statusDistributionSeries}
            type="donut"
            height={250}
          />
        </div>
      </div>

      {/* Announcements Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Megaphone className="w-6 h-6 text-blue-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Announcements</h3>
        </div>
        <div className="space-y-3">
          {mockAnnouncements.map(announcement => (
            <div key={announcement.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white">{announcement.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{announcement.content}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Posted on: {announcement.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity Submissions</h3>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
        
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                  {getStatusIcon(activity.status)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{activity.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{activity.type}</span>
                    <span>•</span>
                    <span>{activity.date}</span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.status)}`}>
                {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Submit New Activity</h3>
              <p className="text-blue-100 text-sm mt-1">Submit a new activity like a conference or paper</p>
            </div>
            <Plus className="w-8 h-8" />
          </div>
          <Link to="/student/submit-activity" className="block mt-4">
            <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 border-white">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Manage Activities</h3>
              <p className="text-green-100 text-sm mt-1">Browse all your submitted activities</p>
            </div>
            <FileText className="w-8 h-8" />
          </div>
          <Link to="/student/manage-activities" className="block mt-4">
            <Button variant="outline" className="bg-white text-green-600 hover:bg-green-50 border-white">
              View Activities
            </Button>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Settings</h3>
              <p className="text-purple-100 text-sm mt-1">Manage your account preferences</p>
            </div>
            <Calendar className="w-8 h-8" />
          </div>
          <Link to="/settings" className="block mt-4">
            <Button variant="outline" className="bg-white text-purple-600 hover:bg-purple-50 border-white">
              Configure
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
