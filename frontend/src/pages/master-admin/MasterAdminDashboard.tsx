import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { 
  Building2, 
  Users, 
  UserCheck, 
  FileText, 
  TrendingUp, 
  Activity,
  CheckCircle
} from 'lucide-react';
import Button from '../../components/ui/button/Button';
import ExportImport from '../../components/common/ExportImport';
import { useTheme } from '../../context/ThemeContext';

// Mock data for dashboard statistics
const systemStats = {
  totalOrganizations: 8,
  totalUsers: 2500,
  activeStaff: 450,
  totalLogs: 15234,
  monthlyGrowth: 8.5,
  systemHealth: 99.5
};

const organizationData = [
  { name: 'Mercy General Hospital', users: 800, logs: 5423, status: 'active' },
  { name: 'City Central Medical College', users: 650, logs: 4756, status: 'active' },
  { name: "St. Jude's Children's Hospital", users: 350, logs: 2234, status: 'active' },
  { name: 'Unity Health System', users: 500, logs: 1123, status: 'inactive' },
  { name: 'Oak Valley Research Institute', users: 200, logs: 1700, status: 'active' }
];

const MasterAdminDashboard: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Chart configurations with theme support
  const userGrowthOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 300,
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
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1
      }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
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
        text: 'Users',
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
    tooltip: {
      theme: isDark ? 'dark' : 'light'
    }
  };

  const userGrowthSeries = [{
    name: 'Total Users',
    data: [850, 920, 1050, 1150, 1180, 1200, 1220, 1230, 1240, 1245, 1247, 1250]
  }];

  const logDistributionOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 300,
      background: 'transparent'
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    },
    colors: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    labels: ['New Cases', 'In Treatment', 'Discharged', 'Observation'],
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

  const logDistributionSeries = [5234, 3892, 2234, 3874];

  const organizationActivityOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      background: 'transparent'
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    },
    colors: ['#6366F1'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true
      }
    },
    xaxis: {
      categories: organizationData.map(org => org.name),
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#6B7280'
        }
      },
      axisBorder: {
        color: isDark ? '#374151' : '#E5E7EB'
      }
    },
    yaxis: {
      title: { 
        text: 'Organizations',
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
    tooltip: {
      theme: isDark ? 'dark' : 'light'
    }
  };

  const organizationActivitySeries = [{
    name: 'Total Logs',
    data: organizationData.map(org => org.logs)
  }];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Master Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">System-wide overview and analytics</p>
        </div>
        <div className="flex space-x-3">
          <ExportImport userRole="MasterAdmin" className="inline-block" />
          <Button>Generate Report</Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Organizations</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{systemStats.totalOrganizations}</p>
            </div>
            <Building2 className="w-12 h-12 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+2 this month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Personnel</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{systemStats.totalUsers.toLocaleString()}</p>
            </div>
            <Users className="w-12 h-12 text-green-500" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+{systemStats.monthlyGrowth}% this month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Staff</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{systemStats.activeStaff}</p>
            </div>
            <UserCheck className="w-12 h-12 text-purple-500" />
          </div>
          <div className="mt-4 flex items-center">
            <Activity className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-sm text-blue-600">85% active today</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Patient Records</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{systemStats.totalLogs.toLocaleString()}</p>
            </div>
            <FileText className="w-12 h-12 text-orange-500" />
          </div>
          <div className="mt-4 flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">234 pending review</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth Trend</h3>
          <Chart
            options={userGrowthOptions}
            series={userGrowthSeries}
            type="area"
            height={300}
          />
        </div>

        {/* Log Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Patient Status Distribution</h3>
          <Chart
            options={logDistributionOptions}
            series={logDistributionSeries}
            type="donut"
            height={300}
          />
        </div>
      </div>

      {/* Organization Activity Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Organization Activity</h3>
        <Chart
          options={organizationActivityOptions}
          series={organizationActivitySeries}
          type="bar"
          height={300}
        />
      </div>

      {/* Recent Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Organizations</h3>
          <div className="space-y-3">
            {organizationData.slice(0, 4).map((org, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{org.users} users • {org.logs} logs</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  org.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {org.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Overall Health</span>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="font-semibold text-green-600">{systemStats.systemHealth}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${systemStats.systemHealth}%` }}></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200">All Systems Operational</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Activity className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">High Performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterAdminDashboard;
