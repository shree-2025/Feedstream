import React, { useEffect, useState } from 'react';
import { Users, FileText, MessageSquare, BarChart3, TrendingUp, Clock, BookOpen, Star } from 'lucide-react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Stats = {
  staffCount: number;
  studentCount: number;
  activeForms: number;
  responses: number;
  avgRating?: number;
};

const DepartmentAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    staffCount: 0,
    studentCount: 0,
    activeForms: 0,
    responses: 0,
    avgRating: 0,
  });
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [subjectCounts, setSubjectCounts] = useState<{ total: number; bySemester: Record<string, number> }>({ total: 0, bySemester: {} });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Compute response rate dynamically and build subject counts
        try {
          const formsRes = await api.get('/feedback/simple/forms', { params: { page: 1, limit: 100 } });
          const items = formsRes?.data?.items || [];
          // Load subjects and compute totals per semester
          try {
            const subjRes = await api.get('/subjects', { params: { page: 1, limit: 1000 } });
            const subjects = subjRes?.data?.items || [];
            const bySem: Record<string, number> = {};
            subjects.forEach((s: any) => {
              const sem = String(s?.semester ?? '').trim();
              const key = sem || 'N/A';
              bySem[key] = (bySem[key] || 0) + 1;
            });
            if (mounted) setSubjectCounts({ total: subjects.length, bySemester: bySem });
          } catch {
            // ignore subject load errors
          }
          // Compute Active Forms dynamically (same logic as FeedbackGeneration)
          const today = new Date().toISOString().slice(0, 10);
          const activeFormsCount = items.filter((f: any) => {
            if (typeof f?.isActive === 'boolean') return !!f.isActive;
            const statusActive = String(f?.status || '').toLowerCase() === 'active';
            const s = f?.startDate || f?.start_date || '';
            const e = f?.endDate || f?.end_date || '';
            const byDate = s && e
              ? (String(s).slice(0, 10) <= today && today <= String(e).slice(0, 10))
              : false;
            return statusActive || byDate;
          }).length;
          if (mounted) setStats(prev => ({ ...prev, activeForms: activeFormsCount }));
          const counts = await Promise.all(
            items.map(async (f: any) => {
              if (!f?.slug) return 0;
              try {
                const r = await api.get(`/feedback/forms/${encodeURIComponent(f.slug)}/responses`, { params: { page: 1, limit: 1 } });
                return Number(r?.data?.total || 0);
              } catch {
                return 0;
              }
            })
          );
          const completed = counts.filter(c => c > 0).length;
          const pending = Math.max(0, items.length - completed);
          if (mounted) setResponseRateData([
            { name: 'Completed', value: completed, color: '#10B981' },
            { name: 'Pending', value: pending, color: '#F59E0B' },
          ]);
        } catch {
          // ignore
        }
      } catch (e) {
        // Fallback: fetch staff total from list endpoint locally
        try {
          const resp = await api.get('/staff', { params: { limit: 1 } });
          const total = resp?.data?.total ?? 0;
          if (mounted) setStats(prev => ({ ...prev, staffCount: total }));
        } catch {
          // ignore
        }
        // Fallback: compute total responses by summing per-form totals from responses endpoint
        try {
          const formsRes = await api.get('/feedback/simple/forms', { params: { page: 1, limit: 100 } });
          const items = formsRes?.data?.items || [];
          let totalResponses = 0;
          // fetch counts efficiently by requesting limit=1 and using total
          const pairs = await Promise.all(
            items.map(async (f: any) => {
              if (!f?.slug) return 0;
              try {
                const r = await api.get(`/feedback/forms/${encodeURIComponent(f.slug)}/responses`, { params: { page: 1, limit: 1 } });
                return Number(r?.data?.total || 0);
              } catch {
                return 0;
              }
            })
          );
          totalResponses = pairs.reduce((a: number, b: number) => a + b, 0);
          if (mounted) setStats(prev => ({ ...prev, responses: totalResponses }));
        } catch {
          // ignore
        }
        // Also compute Active Forms, Subject counts and Response Rate dynamically even on stats failure
        try {
          const formsRes = await api.get('/feedback/simple/forms', { params: { page: 1, limit: 100 } });
          const items = formsRes?.data?.items || [];
          // Subject counts fallback
          try {
            const subjRes = await api.get('/subjects', { params: { page: 1, limit: 1000 } });
            const subjects = subjRes?.data?.items || [];
            const bySem: Record<string, number> = {};
            subjects.forEach((s: any) => {
              const sem = String(s?.semester ?? '').trim();
              const key = sem || 'N/A';
              bySem[key] = (bySem[key] || 0) + 1;
            });
            if (mounted) setSubjectCounts({ total: subjects.length, bySemester: bySem });
          } catch {
            // ignore subject load errors
          }
          // Active forms count (align with FeedbackGeneration)
          const today = new Date().toISOString().slice(0, 10);
          const activeFormsCount = items.filter((f: any) => {
            if (typeof f?.isActive === 'boolean') return !!f.isActive;
            const statusActive = String(f?.status || '').toLowerCase() === 'active';
            const s = f?.startDate || f?.start_date || '';
            const e = f?.endDate || f?.end_date || '';
            const byDate = s && e
              ? (String(s).slice(0, 10) <= today && today <= String(e).slice(0, 10))
              : false;
            return statusActive || byDate;
          }).length;
          if (mounted) setStats(prev => ({ ...prev, activeForms: activeFormsCount }));
          const counts = await Promise.all(
            items.map(async (f: any) => {
              if (!f?.slug) return 0;
              try {
                const r = await api.get(`/feedback/forms/${encodeURIComponent(f.slug)}/responses`, { params: { page: 1, limit: 1 } });
                return Number(r?.data?.total || 0);
              } catch {
                return 0;
              }
            })
          );
          const completed = counts.filter(c => c > 0).length;
          const pending = Math.max(0, items.length - completed);
          if (mounted) setResponseRateData([
            { name: 'Completed', value: completed, color: '#10B981' },
            { name: 'Pending', value: pending, color: '#F59E0B' },
          ]);
        } catch {
          // ignore
        }
      } finally {
        if (mounted) setLoadingStats(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load department-scoped average rating using analytics endpoint
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/feedback/department/analytics');
        const avg = Number(res?.data?.avgRating || 0);
        if (mounted) setStats(prev => ({ ...prev, avgRating: avg }));
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Always load department-scoped total staff count (from /staff total)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await api.get('/staff', { params: { page: 1, limit: 1 } });
        const total = resp?.data?.total ?? 0;
        if (mounted) setStats(prev => ({ ...prev, staffCount: total }));
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load department-scoped total responses by summing per-form counts
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/feedback/department/forms-with-counts');
        const items = res?.data?.items || [];
        const total = items.reduce((acc: number, it: any) => acc + Number(it.responseCount || 0), 0);
        if (mounted) setStats(prev => ({ ...prev, responses: total }));
      } catch {
        // ignore; fall back to any previously computed value
      }
    })();
    return () => { mounted = false; };
  }, []);
  // Mock data for charts
  const feedbackData = [
    { month: 'Jan', responses: 45, forms: 8 },
    { month: 'Feb', responses: 52, forms: 12 },
    { month: 'Mar', responses: 38, forms: 6 },
    { month: 'Apr', responses: 67, forms: 15 },
    { month: 'May', responses: 73, forms: 18 },
    { month: 'Jun', responses: 89, forms: 22 }
  ];
  const [responseRateData, setResponseRateData] = React.useState([
    { name: 'Completed', value: 0, color: '#10B981' },
    { name: 'Pending', value: 0, color: '#F59E0B' }
  ]);

  const subjectFeedbackData = [
    { subject: 'Computer Science', rating: 4.2 },
    { subject: 'Mathematics', rating: 3.8 },
    { subject: 'Physics', rating: 4.0 },
    { subject: 'Chemistry', rating: 3.9 },
    { subject: 'English', rating: 4.1 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Department Dashboard</h1>
      </div>

      {/* Statistic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition"
          onClick={() => navigate('/department-admin/staff')}
          role="button"
          aria-label="Go to Staff"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loadingStats ? '—' : stats.staffCount}
              </p>
            </div>
          </div>
        </div>
        <div
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition"
          onClick={() => navigate('/department-admin/subjects')}
          role="button"
          aria-label="Go to Subjects"
        >
          <div className="flex items-start space-x-4 relative">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Subjects</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{subjectCounts.total}</p>
            </div>
          </div>
        </div>
        <div
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition"
          onClick={() => navigate('/department-admin/feedback/generate')}
          role="button"
          aria-label="Go to Feedback Forms"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Forms</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loadingStats ? '—' : stats.activeForms}
              </p>
            </div>
          </div>
        </div>
        <div
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition"
          onClick={() => navigate('/department-admin/feedback/responses')}
          role="button"
          aria-label="Go to Responses"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <FileText className="w-6 h-6 text-orange-600 dark:text-orange-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loadingStats ? '—' : stats.responses}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-yellow-500" /> Avg Rating: {typeof stats.avgRating === 'number' ? stats.avgRating.toFixed(2) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Responses Over Time */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Feedback Responses Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={feedbackData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="responses" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Rate */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Response Rate
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={responseRateData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }: { name: string; value: number }) => `${name}: ${value}%`}
              >
                {responseRateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Ratings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Average Ratings by Subject
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={subjectFeedbackData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 5]} />
            <YAxis dataKey="subject" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="rating" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Feedback Activity
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">New feedback form created for Computer Science</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
            </div>
            <span className="px-2 py-1 text-xs rounded-full border bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-400/30">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">15 new responses received for Mathematics feedback</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">5 hours ago</p>
            </div>
            <span className="px-2 py-1 text-xs rounded-full border bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-400/30">Responses</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Physics feedback form closed</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
            </div>
            <span className="px-2 py-1 text-xs rounded-full border bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-500/30">Closed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentAdminDashboard;
