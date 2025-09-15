import React, { useEffect, useMemo, useState } from 'react';

const FeedbackActivity: React.FC = () => {
  const API_BASE = useMemo(() => (import.meta.env.VITE_API_URL || 'http://localhost:4000') as string, []);
  const token = typeof window !== 'undefined' ? localStorage.getItem('elog_token') : null;

  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [deptLoading, setDeptLoading] = useState<boolean>(false);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [staffOptions, setStaffOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [subjectOptions, setSubjectOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<any>>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/api/feedback/org/activity`);
      if (from) url.searchParams.set('from', from);
      if (to) url.searchParams.set('to', to);
      if (departmentId) url.searchParams.set('departmentId', departmentId);
      if (staffId) url.searchParams.set('staffId', staffId);
      if (subjectId) url.searchParams.set('subjectId', subjectId);
      url.searchParams.set('limit', '500');
      const res = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to load activity');
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  // initial: load departments and activity
  useEffect(() => {
    (async () => {
      setDeptLoading(true); setDeptError(null);
      try {
        const res = await fetch(`${API_BASE}/org/departments`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data?.items) ? data.items : [];
          setDepartments(items.map((d: any) => ({ id: String(d.id), name: d.name })));
        } else {
          setDeptError('Failed to load departments');
        }
      } catch (e: any) { setDeptError(e?.message || 'Failed to load departments'); }
      finally { setDeptLoading(false); }
      load();
    })();
  }, []);

  // When department changes, load staff and subjects
  useEffect(() => {
    (async () => {
      setStaffOptions([]); setSubjectOptions([]); setStaffId(''); setSubjectId('');
      if (!departmentId) return;
      try {
        const [rStaff, rSubj] = await Promise.all([
          fetch(`${API_BASE}/org/staff?departmentId=${encodeURIComponent(departmentId)}`, {
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          }),
          fetch(`${API_BASE}/api/subjects?department=${encodeURIComponent(departmentId)}&limit=500`, {
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          }),
        ]);
        if (rStaff.ok) {
          const rows = await rStaff.json();
          setStaffOptions(Array.isArray(rows) ? rows.map((s:any) => ({ id: String(s.id), name: s.name })) : []);
        }
        if (rSubj.ok) {
          const data = await rSubj.json();
          const items = Array.isArray(data?.items) ? data.items : [];
          setSubjectOptions(items.map((s:any) => ({ id: String(s.id), name: s.name })));
        }
      } catch {}
    })();
  }, [departmentId]);

  // Auto-apply when staff/subject change (department change already triggers load via user clicking Apply is optional)
  useEffect(() => {
    // Only auto-load if some filter is selected to avoid excessive calls on first mount
    if (departmentId || staffId || subjectId) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, subjectId]);

  const csvHref = useMemo(() => {
    const url = new URL(`${API_BASE}/api/feedback/org/activity.csv`);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    if (departmentId) url.searchParams.set('departmentId', departmentId);
    if (staffId) url.searchParams.set('staffId', staffId);
    if (subjectId) url.searchParams.set('subjectId', subjectId);
    return url.toString();
  }, [API_BASE, from, to, departmentId, staffId, subjectId]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Activity</h1>
          <p className="text-gray-600 dark:text-gray-400">Organization-wide submissions. Filter by date and export CSV.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            href={csvHref}
            target="_blank"
            rel="noreferrer"
          >Export CSV</a>
        </div>
      </div>

      {deptError && (
        <div className="p-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">{deptError}</div>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Department</label>
            <select value={departmentId} onChange={e=>{ setDepartmentId(e.target.value); load(); }} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-w-48">
              <option value="">All</option>
              {deptLoading ? <option>Loading…</option> : departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Staff</label>
            <select value={staffId} onChange={e=>setStaffId(e.target.value)} disabled={!departmentId} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-w-48 disabled:opacity-60">
              <option value="">All</option>
              {staffOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Subject</label>
            <select value={subjectId} onChange={e=>setSubjectId(e.target.value)} disabled={!departmentId} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-w-48 disabled:opacity-60">
              <option value="">All</option>
              {subjectOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">From</label>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">To</label>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900" />
          </div>
          <button onClick={load} className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">Apply</button>
          <button onClick={() => {
            // Reload departments list
            (async () => {
              setDeptLoading(true); setDeptError(null);
              try {
                const res = await fetch(`${API_BASE}/org/departments`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
                if (res.ok) {
                  const data = await res.json();
                  const items = Array.isArray(data?.items) ? data.items : [];
                  setDepartments(items.map((d: any) => ({ id: String(d.id), name: d.name })));
                } else {
                  setDeptError('Failed to load departments');
                }
              } catch (e: any) { setDeptError(e?.message || 'Failed to load departments'); }
              finally { setDeptLoading(false); }
            })();
          }} className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">Reload Depts</button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="text-left px-4 py-2">Submitted At</th>
                <th className="text-left px-4 py-2">Department</th>
                <th className="text-left px-4 py-2">Subject</th>
                <th className="text-left px-4 py-2">Staff</th>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-center text-gray-600 dark:text-gray-300" colSpan={7}>Loading...</td></tr>
              ) : items.length ? (
                items.map((r:any) => (
                  <tr key={`${r.source}-${r.id}`} className="border-t border-gray-100 dark:border-gray-700/60">
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{r.submittedAt}</td>
                    <td className="px-4 py-2">{r.departmentName || '—'}</td>
                    <td className="px-4 py-2">{r.subjectName || '—'}</td>
                    <td className="px-4 py-2">{r.staffName || '—'}</td>
                    <td className="px-4 py-2">{r.name || '—'}</td>
                    <td className="px-4 py-2">{r.email || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr><td className="px-4 py-6 text-center text-gray-600 dark:text-gray-300" colSpan={7}>No activity found for the selected range.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeedbackActivity;
