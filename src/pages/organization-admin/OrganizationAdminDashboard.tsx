import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, Users, BarChart2, Notebook } from 'lucide-react';
import DepartmentStaffChart from '../../components/charts/DepartmentStaffChart';
import DepartmentStudentChart from '../../components/charts/DepartmentStudentChart';
import { departments } from '../../data/mockData';

const OrganizationAdminDashboard: React.FC = () => {
  const [orgDeptCount, setOrgDeptCount] = useState<number>(0);
  const [orgDepartments, setOrgDepartments] = useState<Array<{ id: string; name: string; managerName: string; email: string }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [deptStats, setDeptStats] = useState<Array<{ id: string; name: string; staffCount: number; studentCount: number }>>([]);
  const [feedbackStats, setFeedbackStats] = useState<Array<{ name: string; responseCount: number }>>([]);
  // New: subject & staff feedback distribution
  const [subjectDeptId, setSubjectDeptId] = useState<string>('');
  const [subjectOptions, setSubjectOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [subjectRespStats, setSubjectRespStats] = useState<Array<{ id: string; name: string; responseCount: number }>>([]);
  const [subjectRefreshTick, setSubjectRefreshTick] = useState<number>(0);

  const [staffDeptId, setStaffDeptId] = useState<string>('');
  const [staffRespStats, setStaffRespStats] = useState<Array<{ id: string; name: string; responseCount: number }>>([]);
  const [staffRefreshTick, setStaffRefreshTick] = useState<number>(0);
  const [staffOptions, setStaffOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'hod'>('name');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
  const [orgStaffCount, setOrgStaffCount] = useState<number>(0);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [orgFeedbackCount, setOrgFeedbackCount] = useState<number>(0);
  const [feedbackCountLoading, setFeedbackCountLoading] = useState<boolean>(false);
  const [feedbackCountError, setFeedbackCountError] = useState<string | null>(null);

  const API_BASE = useMemo(() => (import.meta.env.VITE_API_URL || 'http://localhost:4000') as string, []);
  const token = typeof window !== 'undefined' ? localStorage.getItem('elog_token') : null;

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/org/departments`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error('Failed to load departments');
        const list = await res.json();
        const mapped = Array.isArray(list)
          ? list.map((d: any) => ({ id: String(d.id), name: d.name, managerName: d.managerName || '', email: d.email }))
          : [];
        setOrgDepartments(mapped);
        setOrgDeptCount(mapped.length);
      } catch (e: any) {
        setError(e?.message || 'Failed to load department count');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [API_BASE, token]);

  // Load total feedback count dynamically (organization-wide)
  useEffect(() => {
    const run = async () => {
      setFeedbackCountLoading(true);
      setFeedbackCountError(null);
      try {
        const res = await fetch(`${API_BASE}/api/feedback/org/stats/total-feedback`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error('Failed to load total feedback');
        const data = await res.json();
        setOrgFeedbackCount(Number(data?.total) || 0);
      } catch (e: any) {
        setFeedbackCountError(e?.message || 'Failed to load total feedback');
      } finally {
        setFeedbackCountLoading(false);
      }
    };
    run();
  }, [API_BASE, token]);

  // Load subjects for the selected department (for subject chart filter)
  useEffect(() => {
    const run = async () => {
      if (!subjectDeptId) { setSubjectOptions([]); setSelectedSubjectId('all'); return; }
      try {
        const res = await fetch(`${API_BASE}/api/subjects?department=${encodeURIComponent(subjectDeptId)}&limit=200`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error('Failed to load subjects');
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        setSubjectOptions(items.map((s: any) => ({ id: String(s.id), name: s.name })));
      } catch {
        setSubjectOptions([]);
      }
    };
    run();
  }, [API_BASE, token, subjectDeptId, subjectRefreshTick]);

  // Load subject-wise response stats for organization, optional department filter
  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(`${API_BASE}/api/feedback/org/stats/subject-responses`);
        if (subjectDeptId) url.searchParams.set('departmentId', subjectDeptId);
        const res = await fetch(url.toString(), {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error('Failed to load subject response stats');
        const rows = await res.json();
        let list: Array<{ id: string; name: string; responseCount: number }>
          = Array.isArray(rows) ? rows.map((x: any) => ({ id: String(x.id), name: x.name, responseCount: Number(x.responseCount) || 0 })) : [];
        if (selectedSubjectId && selectedSubjectId !== 'all') {
          list = list.filter((x) => x.id === selectedSubjectId);
        }
        setSubjectRespStats(list);
      } catch {
        setSubjectRespStats([]);
      }
    };
    run();
  }, [API_BASE, token, subjectDeptId, selectedSubjectId, subjectOptions, subjectRefreshTick]);

  // Load staff-wise response stats for organization, optional department filter
  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(`${API_BASE}/api/feedback/org/stats/staff-responses`);
        if (staffDeptId) url.searchParams.set('departmentId', staffDeptId);
        const res = await fetch(url.toString(), {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error('Failed to load staff response stats');
        const rows = await res.json();
        const list: Array<{ id: string; name: string; responseCount: number }>
          = Array.isArray(rows) ? rows.map((x: any) => ({ id: String(x.id), name: x.name, responseCount: Number(x.responseCount) || 0 })) : [];
        setStaffRespStats(list);
      } catch {
        setStaffRespStats([]);
      }
    };
    run();
  }, [API_BASE, token, staffDeptId, staffRefreshTick]);

  // Load staff options for selected department (to include zero-count staff in chart)
  useEffect(() => {
    const run = async () => {
      if (!staffDeptId) { setStaffOptions([]); return; }
      try {
        const res = await fetch(`${API_BASE}/org/staff?departmentId=${encodeURIComponent(staffDeptId)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error('Failed to load staff list');
        const rows = await res.json();
        const opts = Array.isArray(rows) ? rows.map((r: any) => ({ id: String(r.id), name: r.name })) : [];
        setStaffOptions(opts);
      } catch {
        setStaffOptions([]);
      }
    };
    run();
  }, [API_BASE, token, staffDeptId, staffRefreshTick]);

  // Load total staff count dynamically
  useEffect(() => {
    const run = async () => {
      setStaffLoading(true);
      setStaffError(null);
      try {
        const res = await fetch(`${API_BASE}/org/staff/count`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error('Failed to load staff count');
        const data = await res.json();
        setOrgStaffCount(Number(data?.total) || 0);
      } catch (e: any) {
        setStaffError(e?.message || 'Failed to load staff count');
      } finally {
        setStaffLoading(false);
      }
    };
    run();
  }, [API_BASE, token]);

  // Load live stats for charts
  useEffect(() => {
    const run = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const res = await fetch(`${API_BASE}/org/departments/stats`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error('Failed to load department stats');
        const data = await res.json();
        const mapped = Array.isArray(data)
          ? data.map((d: any) => ({ id: String(d.id), name: d.name, staffCount: Number(d.staffCount) || 0, studentCount: Number(d.studentCount) || 0 }))
          : [];
        setDeptStats(mapped);

        // Load feedback distribution by department (in parallel after first succeeds)
        try {
          const r2 = await fetch(`${API_BASE}/api/feedback/org/stats/department-responses`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (!r2.ok) throw new Error('Failed to load feedback stats');
          const rows = await r2.json();
          const fb = Array.isArray(rows) ? rows.map((x: any) => ({ name: x.name, responseCount: Number(x.responseCount) || 0 })) : [];
          setFeedbackStats(fb);
        } catch (e) {
          // Non-fatal for charts; leave feedbackStats empty
        }
      } catch (e: any) {
        setStatsError(e?.message || 'Failed to load department stats');
      } finally {
        setStatsLoading(false);
      }
    };
    run();
  }, [API_BASE, token]);

  // Chart data prefers live stats; fallback to mock if needed
  const departmentData = (deptStats.length
    ? deptStats.map(s => ({ id: s.id, name: s.name, hod: '', staffCount: s.staffCount, studentCount: s.studentCount }))
    : (orgDepartments.length ? orgDepartments : departments).map(dept => ({
        id: dept.id,
        name: dept.name,
        hod: (dept as any).managerName || (dept as any).hod || '',
        staffCount: 0,
        studentCount: 0,
      }))
  );

  const totalDepartments = orgDeptCount || 0;
  const totalStaff = orgStaffCount || 0;
  const totalFeedback = orgFeedbackCount || 0;

  const stats = [
    {
      title: 'Total Departments',
      value: totalDepartments.toString(),
      icon: <Building className="h-8 w-8 text-blue-500" />,
    },
    {
      title: 'Total Staff',
      value: totalStaff.toString(),
      icon: <Users className="h-8 w-8 text-green-500" />,
    },
    {
      title: 'Total Feedback',
      value: totalFeedback.toString(),
      icon: <Notebook className="h-8 w-8 text-yellow-500" />,
      link: '/organization-admin/feedback-activity',
    },
    {
      title: 'Analytics Overview',
      value: 'View Details',
      icon: <BarChart2 className="h-8 w-8 text-purple-500" />,
    },
  ];

  // Build staff chart data: include all staff in selected department with zero counts where needed
  const staffChartData = useMemo(() => {
    if (!staffDeptId || !staffOptions.length) {
      // No department selected: just show whatever aggregated stats we have
      return staffRespStats.map(s => ({ name: s.name, responseCount: s.responseCount }));
    }
    const map = new Map(staffRespStats.map(s => [s.id, s]));
    const rows = staffOptions.map(opt => ({
      id: opt.id,
      name: opt.name,
      responseCount: map.get(opt.id)?.responseCount || 0,
    }));
    return rows.map(r => ({ name: r.name, responseCount: r.responseCount }));
  }, [staffDeptId, staffOptions, staffRespStats]);

  // Merge staff options with stats for listing: show all known staff even if options API returns none
  const mergedStaffList = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; responseCount: number }>();
    for (const s of staffOptions) {
      byId.set(s.id, { id: s.id, name: s.name, responseCount: 0 });
    }
    for (const s of staffRespStats) {
      const prev = byId.get(s.id);
      if (prev) {
        prev.responseCount = s.responseCount;
        // prefer a non-empty name from stats if options didn't have one
        if (!prev.name && s.name) prev.name = s.name;
      } else {
        byId.set(s.id, { id: s.id, name: s.name, responseCount: s.responseCount });
      }
    }
    // If neither had ids, fall back to stats by name as keys
    if (!byId.size && staffRespStats.length) {
      return staffRespStats.map(s => ({ id: s.id || s.name, name: s.name, responseCount: s.responseCount }));
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [staffOptions, staffRespStats]);

  // Merge subject stats with subject options to include zero-count subjects in chart
  const subjectChartData = useMemo(() => {
    // If no department selected, just show whatever stats we have (could be org-wide)
    if (!subjectDeptId || !subjectOptions.length) {
      const rows = subjectRespStats.map(s => ({ name: s.name, responseCount: s.responseCount }));
      // Apply single-subject filter if chosen (defensive)
      if (selectedSubjectId && selectedSubjectId !== 'all') {
        const opt = subjectOptions.find(o => o.id === selectedSubjectId);
        return rows.filter(r => !opt || r.name === opt.name);
      }
      return rows;
    }

    // Build rows for all subjects in selected department
    const map = new Map(subjectRespStats.map(s => [s.id, s]));
    let rows = subjectOptions.map(opt => ({
      id: opt.id,
      name: opt.name,
      responseCount: map.get(opt.id)?.responseCount || 0,
    }));
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      rows = rows.filter(r => r.id === selectedSubjectId);
    }
    return rows.map(r => ({ name: r.name, responseCount: r.responseCount }));
  }, [subjectDeptId, subjectOptions, subjectRespStats, selectedSubjectId]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, Admin!</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const card = (
            <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.title === 'Total Departments'
                      ? (loading ? '...' : error ? '—' : totalDepartments)
                      : stat.title === 'Total Staff'
                        ? (staffLoading ? '...' : staffError ? '—' : totalStaff)
                        : stat.title === 'Total Feedback'
                          ? (feedbackCountLoading ? '...' : feedbackCountError ? '—' : totalFeedback)
                          : stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
          return stat.link ? (
            <Link to={stat.link} key={idx} className="block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl">
              {card}
            </Link>
          ) : (
            <div key={idx}>{card}</div>
          );
        })}
      </div>

      {/* Analytics Section */}
      <div className="mt-6">
        {statsLoading && (
          <div className="mb-3 text-sm px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300">Loading charts…</div>
        )}
        {statsError && (
          <div className="mb-3 text-sm px-3 py-2 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">{statsError}</div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DepartmentStaffChart data={departmentData} />
          <DepartmentStudentChart
            data={feedbackStats.length ? feedbackStats : departmentData.map(d => ({ name: d.name, responseCount: 0 }))}
            title="Total Feedback Distribution by Department"
            valueKey="responseCount"
            barLabel="Number of Feedback Responses"
          />
        </div>
      </div>

      {/* Subject & Staff Feedback Distribution with filters */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feedback by Subject</h3>
            <div className="flex items-center gap-2">
              <select
                className="px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200"
                value={subjectDeptId}
                onChange={(e) => { setSubjectDeptId(e.target.value); setSelectedSubjectId('all'); }}
              >
                <option value="">All Departments</option>
                {orgDepartments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
              <select
                className="px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={!subjectDeptId || !subjectOptions.length}
              >
                <option value="all">All Subjects</option>
                {subjectOptions.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              <button
                type="button"
                onClick={() => setSubjectRefreshTick(t => t + 1)}
                className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-sm"
              >Reload</button>
            </div>
          </div>
          <DepartmentStudentChart
            data={subjectChartData}
            title="Total Feedback Distribution by Subject"
            valueKey="responseCount"
            barLabel="Number of Feedback Responses"
          />
          {/* Subject list for selected department */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Subjects{subjectDeptId ? ` in ${orgDepartments.find(d=>d.id===subjectDeptId)?.name || 'Department'}` : ''}</h4>
            {subjectDeptId ? (
              subjectOptions.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subjectOptions.map(s => {
                    const count = subjectRespStats.find(x => x.id === s.id)?.responseCount || 0;
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900">
                        <span className="text-sm text-gray-800 dark:text-gray-200">{s.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-700/40">{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-300">No subjects found for the selected department.</div>
              )
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-300">Select a department to list its subjects.</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feedback by Staff</h3>
            <div className="flex items-center gap-2">
              <select
                className="px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200"
                value={staffDeptId}
                onChange={(e) => { setStaffDeptId(e.target.value); setStaffRefreshTick(t => t + 1); }}
              >
                <option value="">All Departments</option>
                {orgDepartments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
              <button
                type="button"
                onClick={() => setStaffRefreshTick(t => t + 1)}
                className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-sm"
              >Reload</button>
            </div>
          </div>
          <DepartmentStudentChart
            data={staffChartData}
            title="Total Feedback Distribution by Staff"
            valueKey="responseCount"
            barLabel="Number of Feedback Responses"
          />
          {/* Staff list for selected department */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Staff{staffDeptId ? ` in ${orgDepartments.find(d=>d.id===staffDeptId)?.name || 'Department'}` : ''}</h4>
            {staffDeptId ? (
              mergedStaffList.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mergedStaffList.map(s => {
                    const count = s.responseCount ?? (staffRespStats.find(x => x.id === s.id)?.responseCount || 0);
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900">
                        <span className="text-sm text-gray-800 dark:text-gray-200">{s.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-700/40">{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-300">No staff found for the selected department.</div>
              )
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-300">Select a department to list its staff.</div>
            )}
          </div>
        </div>
      </div>

      {/* Your Departments (from API) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Departments</h2>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or HOD..."
              className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200"
            >
              <option value="name">Sort: Name</option>
              <option value="hod">Sort: HOD</option>
            </select>
            <span className="text-xs px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{loading ? '...' : orgDeptCount} total</span>
          </div>
        </div>
        {error && (
          <div className="p-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">{error}</div>
        )}
        {!error && (
          orgDepartments.length ? (
            (() => {
              const filtered = orgDepartments
                .filter(d =>
                  d.name.toLowerCase().includes(search.toLowerCase()) ||
                  d.managerName.toLowerCase().includes(search.toLowerCase())
                )
                .sort((a, b) => {
                  if (sortBy === 'name') return a.name.localeCompare(b.name);
                  return (a.managerName || '').localeCompare(b.managerName || '');
                });
              const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
              const safePage = Math.min(page, totalPages);
              const start = (safePage - 1) * pageSize;
              const items = filtered.slice(start, start + pageSize);
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(d => (
                      <Link key={d.id} to={`/organization-admin/department/${d.id}`} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{d.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">HOD: {d.managerName || '—'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Email: {d.email}</p>
                      </Link>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span>Rows per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                        className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      >
                        <option value={6}>6</option>
                        <option value={9}>9</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                      </select>
                      <span>Page {safePage} of {totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-50"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                      >Previous</button>
                      <button
                        className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-50"
                        onClick={() => setPage(p => p + 1)}
                        disabled={safePage >= totalPages}
                      >Next</button>
                    </div>
                  </div>
                </>
              );
            })()
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-300">No departments found for this organization.</div>
          )
        )}
      </div>
    </div>
  );
}

export default OrganizationAdminDashboard;
