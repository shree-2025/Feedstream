import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Users, Star, FileText } from 'lucide-react';
import api from '../../utils/api';

type Analytics = {
  totalResponses: number;
  avgRating: number;
  ratingBuckets: Record<string, number>;
  subjectStats: { subjectId: number; subjectName?: string; responses: number; avgRating: number }[];
  staffStats: { staffId: number; staffName?: string; responses: number; avgRating: number }[];
};

type Option = { id: number; name: string };
type SubjectOption = { id: number; name: string; semester?: string };

const COLORS = ['#10B981', '#34D399', '#F59E0B', '#F97316', '#EF4444'];

const FeedbackAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Analytics | null>(null);
  const [staffOptions, setStaffOptions] = useState<Option[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [allSemesters, setAllSemesters] = useState<string[]>([]);

  // Filters
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [semester, setSemester] = useState<string>('');

  // Load filter options once
  useEffect(() => {
    (async () => {
      try {
        const [staffRes, subjRes] = await Promise.all([
          api.get('/staff', { params: { page: 1, limit: 1000 } }),
          api.get('/subjects', { params: { page: 1, limit: 1000 } }),
        ]);
        setStaffOptions((staffRes.data?.items || []).map((s: any) => ({ id: s.id, name: s.name })));
        const subjItems = (subjRes.data?.items || []);
        setSubjectOptions(subjItems.map((s: any) => ({ id: s.id, name: s.name, semester: String(s?.semester ?? '') })));
        // Build full semester list from subjects, sorted ascending and numeric-aware
        const sems: string[] = Array.from(new Set(subjItems.map((s: any) => String(s?.semester ?? '')).filter((x: string) => x !== '')));
        sems.sort((a, b) => {
          const na = Number(a), nb = Number(b);
          const aNum = !isNaN(na), bNum = !isNaN(nb);
          if (aNum && bNum) return na - nb;
          return a.localeCompare(b);
        });
        setAllSemesters(sems);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Load analytics when filters change
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/feedback/department/analytics', {
          params: {
            from: from || undefined,
            to: to || undefined,
            staffId: staffId || undefined,
            subjectId: subjectId || undefined,
            semester: semester || undefined,
          },
        });
        if (!mounted) return;
        setData(res.data as Analytics);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'Failed to load analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [from, to, staffId, subjectId, semester]);

  const ratingData = useMemo(() => {
    const buckets = data?.ratingBuckets || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const order = ['5', '4', '3', '2', '1'];
    return order.map((k, idx) => ({ name: `${k} Stars`, value: Number(buckets[k] || 0), fill: COLORS[idx] }));
  }, [data]);

  // Note: subject performance visualization removed; re-add if needed by using `data.subjectStats`

  const staffPerformance = useMemo(() => {
    return (data?.staffStats || []).map(s => ({
      name: s.staffName || String(s.staffId),
      rating: Number(s.avgRating.toFixed(2)),
      responses: s.responses,
    }));
  }, [data]);

  const semesterData = useMemo(() => {
    const statsList = (data as any)?.semesterStats || [];
    const statsMap = new Map<string, number>();
    statsList.forEach((x: any) => {
      const key = String(x.semester || 'N/A');
      statsMap.set(key, Number(x.responses || 0));
    });
    // Ensure all semesters from catalog are present with 0 when missing
    const names = allSemesters.length ? allSemesters : Array.from(statsMap.keys());
    const rows = names.map((name) => ({ name, responses: statsMap.get(name) ?? 0 }));
    // sort ascending numeric-aware
    rows.sort((a, b) => {
      const na = Number(a.name), nb = Number(b.name);
      const aNum = !isNaN(na), bNum = !isNaN(nb);
      if (aNum && bNum) return na - nb;
      return a.name.localeCompare(b.name);
    });
    return rows;
  }, [data, allSemesters]);


  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Insights and trends from student feedback</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800" />
          <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800" />
          <select value={semester} onChange={(e)=>{ setSemester(e.target.value); setSubjectId(''); }} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800">
            <option value="">All Semesters</option>
            {allSemesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={staffId} onChange={(e)=>setStaffId(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800">
            <option value="">All Staff</option>
            {staffOptions.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
          <select value={subjectId} onChange={(e)=>setSubjectId(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800">
            <option value="">All Subjects</option>
            {subjectOptions
              .filter(s => !semester || String(s.semester || '') === semester)
              .map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
          <button className="px-3 py-2 rounded-md bg-indigo-600 text-white flex items-center gap-2" onClick={()=>window.print()}>
            <Download size={16}/> Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Feedback</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{loading ? '—' : (data?.totalResponses ?? 0)}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Rating</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{loading ? '—' : (data?.avgRating?.toFixed(2) ?? '0.00')}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">Response Rate</p>
          <p className="text-2xl font-bold">—</p>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1"><Users size={14}/> of invited</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">Active Courses</p>
          <p className="text-2xl font-bold">{subjectOptions.length}</p>
          <div className="mt-2 text-xs text-gray-500">subjects with feedback</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border">
          <h3 className="font-semibold mb-3">Rating Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie dataKey="value" data={ratingData} innerRadius={60} outerRadius={90} label>
                  {ratingData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend mapping colors to star buckets (inline format) */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            {ratingData.map((d, i) => (
              <div key={d.name} className="inline-flex items-center gap-2">
                <span
                  className="inline-block w-3.5 h-3.5 rounded-[3px]"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  aria-hidden
                />
                <span style={{ color: COLORS[i % COLORS.length] }}>{d.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Average rating: <span className="font-semibold text-gray-900 dark:text-white">{loading ? '—' : (data?.avgRating?.toFixed(2) ?? '0.00')}</span>
            <span className="ml-1 text-yellow-500">★</span>
          </div>
        </div>

        {/* Semester-wise Responses */}
        <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border">
          <h3 className="font-semibold mb-3">Responses by Semester</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={semesterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" label={{ value: 'Semester', position: 'insideBottom', offset: -4 }} />
                <YAxis label={{ value: 'Responses', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="responses" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Staff Performance */}
      <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border">
        <h3 className="font-semibold mb-3">Staff by Responses</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={staffPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="responses" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default FeedbackAnalytics;
