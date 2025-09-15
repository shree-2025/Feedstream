import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Button from '../../components/ui/button/Button';

const DepartmentSingleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState<{ id: string; name: string; managerName: string; email: string } | null>(null);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code?: string; semester?: string; credits?: number; type?: string; instructor?: string }>>([]);
  const [subjectsLoading, setSubjectsLoading] = useState<boolean>(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

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
        const found = (list || []).find((d: any) => String(d.id) === String(id));
        if (!found) {
          setDepartment(null);
          setError('Department not found.');
        } else {
          setDepartment({ id: String(found.id), name: found.name, managerName: found.managerName || '', email: found.email });
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load department');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [API_BASE, token, id]);

  // Load subjects for this department (visible to ORG)
  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setSubjectsLoading(true);
      setSubjectsError(null);
      try {
        const url = `${API_BASE}/api/subjects?department=${encodeURIComponent(String(id))}&limit=100`;
        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error('Failed to load subjects');
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        const mapped = items.map((s: any) => ({
          id: String(s.id),
          name: s.name,
          code: s.code,
          semester: s.semester,
          credits: s.credits,
          type: s.type,
          instructor: s.instructor,
        }));
        setSubjects(mapped);
      } catch (e: any) {
        setSubjectsError(e?.message || 'Failed to load subjects');
      } finally {
        setSubjectsLoading(false);
      }
    };
    run();
  }, [API_BASE, token, id]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center gap-3">
        <Link to="/organization-admin/departments"><Button variant="outline" size="icon" aria-label="Back"><ChevronLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Department</h1>
      </div>

      {loading && (
        <div className="p-4 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-white">Loading...</div>
      )}
      {error && !loading && (
        <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</div>
      )}

      {department && !loading && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{department.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">HOD: {department.managerName || '—'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Email: {department.email}</p>
            </div>
          </div>

          {/* Subjects Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subjects</h3>
              <span className="text-xs px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{subjects.length} total</span>
            </div>

            {subjectsLoading && (
              <div className="p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200">Loading subjects...</div>
            )}
            {subjectsError && !subjectsLoading && (
              <div className="p-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">{subjectsError}</div>
            )}

            {!subjectsLoading && !subjectsError && (
              subjects.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map(s => (
                    <div key={s.id} className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{s.code || '—'}</div>
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white">{s.name}</h4>
                        </div>
                        {s.type && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-700/40">{s.type}</span>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Semester</div>
                          <div>{s.semester || '—'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Credits</div>
                          <div>{s.credits ?? '—'}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Instructor</div>
                          <div>{s.instructor || '—'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-300">No subjects found for this department.</div>
              )
            )}
          </div>
        </div>
      )}

      {/* Placeholder for further details (staff/students) once endpoints are wired */}
    </div>
  );
};

export default DepartmentSingleView;
