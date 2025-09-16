import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { Download, ExternalLink, ListOrdered, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'text' | 'rating';
  options?: string[];
}

interface Staff { id: number; name: string }
interface Subject { id: number; name: string }

interface ListedForm {
  id: number;
  slug: string;
  title?: string;
  teacherId: number;
  subjectId: number;
  questionIds: number[];
  startDate: string;
  endDate: string;
  semester?: string | null;
  createdAt: string;
}

interface ResponseItem { id: number; submittedAt: string; answers: Record<string, any> }

const FeedbackResponses: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forms, setForms] = useState<ListedForm[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filterText, setFilterText] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activeResponses, setActiveResponses] = useState<ResponseItem[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeError, setActiveError] = useState<string | null>(null);
  const [detail, setDetail] = useState<null | { id: number; qas: { label: string; value: string }[] }>(null);

  // Total responses across all forms (based on counts map)
  const totalResponses = useMemo(() => {
    return Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0);
  }, [counts]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [formsRes, staffRes, subjRes, quesRes] = await Promise.all([
          // Department-scoped forms with counts coming directly from feedback_master_responses
          api.get('/feedback/department/forms-with-counts'),
          api.get('/staff', { params: { page: 1, limit: 1000 } }),
          api.get('/subjects', { params: { page: 1, limit: 1000 } }),
          api.get('/questions', { params: { page: 1, limit: 1000 } }),
        ]);
        if (!mounted) return;
        const items: ListedForm[] = (formsRes.data?.items || []).map((f: any) => ({
          id: f.id,
          // Prefer the accessCode-like slug for the public Open link (may be null)
          slug: f.slug || f.accessCode || null,
          title: f.title,
          teacherId: f.teacherId,
          subjectId: f.subjectId,
          questionIds: f.questionIds || [],
          startDate: f.startDate,
          endDate: f.endDate,
          semester: f.semester,
          createdAt: f.createdAt,
        }));
        setForms(items);
        setStaff((staffRes.data?.items || []).map((s: any) => ({ id: s.id, name: s.name })));
        setSubjects((subjRes.data?.items || []).map((s: any) => ({ id: s.id, name: s.name })));
        setQuestions((quesRes.data?.items || []).map((q: any) => ({ id: q.id, text: q.text, type: q.type, options: q.options })));

        // counts come from formsRes directly (responseCount per form id)
        const nextCounts: Record<string, number> = {};
        (formsRes.data?.items || []).forEach((f: any) => {
          nextCounts[String(f.id)] = Number(f.responseCount || 0);
        });
        setCounts(nextCounts);
        toast.success('Forms loaded');
      } catch (e: any) {
        if (!mounted) return;
        const msg = e?.response?.data?.message || 'Failed to load forms';
        setError(msg);
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const labelsById = useMemo(() => {
    const s: Record<number, string> = {};
    staff.forEach(x => { s[x.id] = x.name; });
    const subj: Record<number, string> = {};
    subjects.forEach(x => { subj[x.id] = x.name; });
    return { staff: s, subjects: subj };
  }, [staff, subjects]);

  const questionById = useMemo(() => {
    const m = new Map<number, Question>();
    questions.forEach(q => m.set(q.id, q));
    return m;
  }, [questions]);

  const filteredForms = useMemo(() => {
    return forms.filter(f => {
      const matchesText = filterText.trim().length === 0 || (f.title || f.slug || '').toLowerCase().includes(filterText.toLowerCase());
      const matchesSem = !filterSemester || String(f.semester || '').toLowerCase() === filterSemester.toLowerCase();
      const matchesStaff = !filterStaff || String(f.teacherId) === filterStaff;
      const matchesSubject = !filterSubject || String(f.subjectId) === filterSubject;
      return matchesText && matchesSem && matchesStaff && matchesSubject;
    });
  }, [forms, filterText, filterSemester, filterStaff, filterSubject]);

  // Options for dependent filters
  const semesterOptions = useMemo(() => {
    const vals = Array.from(new Set(forms.map(f => String(f.semester ?? '')).filter(Boolean)));
    // Sort ascending; attempt numeric sort when possible
    return vals.sort((a, b) => {
      const na = Number(a), nb = Number(b);
      const aNum = !isNaN(na), bNum = !isNaN(nb);
      if (aNum && bNum) return na - nb;
      return a.localeCompare(b);
    });
  }, [forms]);

  const staffOptions = useMemo(() => {
    let list = forms;
    if (filterSemester) list = list.filter(f => String(f.semester || '') === filterSemester);
    const ids = Array.from(new Set(list.map(f => f.teacherId).filter((x): x is number => x != null)));
    return staff.filter(s => ids.includes(s.id));
  }, [forms, staff, filterSemester]);

  const subjectOptions = useMemo(() => {
    let list = forms;
    if (filterSemester) list = list.filter(f => String(f.semester || '') === filterSemester);
    if (filterStaff) list = list.filter(f => String(f.teacherId) === filterStaff);
    const ids = Array.from(new Set(list.map(f => f.subjectId).filter((x): x is number => x != null)));
    return subjects.filter(s => ids.includes(s.id));
  }, [forms, subjects, filterSemester, filterStaff]);

  // Reset dependent selections if they become invalid
  useEffect(() => {
    const validStaffIds = new Set(staffOptions.map(s => String(s.id)));
    if (filterStaff && !validStaffIds.has(filterStaff)) {
      setFilterStaff('');
    }
  }, [filterSemester, staffOptions]);

  useEffect(() => {
    const validSubjectIds = new Set(subjectOptions.map(s => String(s.id)));
    if (filterSubject && !validSubjectIds.has(filterSubject)) {
      setFilterSubject('');
    }
  }, [filterSemester, filterStaff, subjectOptions]);

  const openResponses = async (id: string | number) => {
    try {
      setActiveSlug(String(id));
      setActiveLoading(true);
      setActiveError(null);
      const r = await api.get(`/feedback/forms/by-id/${encodeURIComponent(String(id))}/responses`, {
        params: {
          page: 1,
          limit: 100,
          // pass subject filter to backend so responses are scoped dynamically
          subjectId: filterSubject ? Number(filterSubject) : undefined,
        },
      });
      const items: ResponseItem[] = (r.data?.items || []).map((it: any) => ({
        id: it.id,
        submittedAt: it.submittedAt,
        answers: it.answers || {},
      }));
      setActiveResponses(items);
      toast.success('Responses loaded');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to load responses';
      setActiveError(msg);
      toast.error(msg);
    } finally {
      setActiveLoading(false);
    }
  };

  const openDetail = (r: ResponseItem) => {
    const qas: { label: string; value: string }[] = [];
    const ans = r.answers || {};
    Object.keys(ans)
      .filter(k => k !== 'name' && k !== 'email' && k !== 'phone')
      .forEach(k => {
        const label = questionById.get(Number(k))?.text || `Q${String(k)}`;
        const v = ans[k];
        const value = Array.isArray(v) ? v.join(', ') : (v ?? '');
        qas.push({ label, value: String(value) });
      });
    setDetail({ id: r.id, qas });
  };

  const closeDetail = () => setDetail(null);

  const exportCSV = async (id: string | number) => {
    const toastId = `csv-${id}`;
    try {
      toast.loading('Preparing CSV…', { id: toastId });
      const res = await api.get(`/feedback/forms/by-id/${encodeURIComponent(String(id))}/responses.csv`, {
        params: { subjectId: filterSubject ? Number(filterSubject) : undefined },
        responseType: 'blob',
      });
      // If server mistakenly returns JSON error as blob, try to detect
      const contentType = res.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const text = await res.data.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || text || 'Export failed');
        } catch (e) {
          throw new Error('Export failed');
        }
      }
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dt = new Date();
      const stamp = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      a.download = `responses-${id}-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started', { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to export CSV', { id: toastId });
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Responses</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">View forms, counts, and responses. Export as CSV.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-sm dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-400/30">
              Total responses: {totalResponses}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search by title..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
          />
          <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800">
            <option value="">All Semesters</option>
            {semesterOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800">
            <option value="">All Staff</option>
            {staffOptions.map(s => (<option key={s.id} value={String(s.id)}>{s.name}</option>))}
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800">
            <option value="">All Subjects</option>
            {subjectOptions.map(s => (<option key={s.id} value={String(s.id)}>{s.name}</option>))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Form Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Responses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td className="px-6 py-4" colSpan={6}>Loading…</td></tr>
              ) : error ? (
                <tr><td className="px-6 py-4 text-red-600" colSpan={6}>{error}</td></tr>
              ) : forms.length === 0 ? (
                <tr><td className="px-6 py-4" colSpan={6}>No forms yet.</td></tr>
              ) : (
                filteredForms.map((f) => (
                  <tr key={f.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{f.title || f.slug}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{labelsById.staff[f.teacherId] || f.teacherId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{labelsById.subjects[f.subjectId] || f.subjectId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{f.semester || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <ListOrdered size={14} /> {counts[String(f.id)] ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                      <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={() => openResponses(f.id)} title="View responses">View</button>
                      <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => exportCSV(f.id)} title="Export CSV">
                        <Download size={16} /> CSV
                      </button>
                      <a className={`inline-flex items-center gap-1 ${f.slug ? 'text-indigo-600 hover:text-indigo-800' : 'text-gray-400 pointer-events-none'}`} href={f.slug ? `/feedback/public/simple/${encodeURIComponent(f.slug)}` : '#'} target="_blank" rel="noreferrer">
                        Open <ExternalLink size={14} />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal: Responses popup */}
        {activeSlug && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={() => setActiveSlug(null)} />
            {/* Dialog */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-6xl max-h-[85vh] overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b bg-white/90 dark:bg-gray-800/90 backdrop-blur border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Responses for {(forms.find(f => f.slug === activeSlug)?.title) || activeSlug}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{counts[activeSlug] ?? 0} total</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => exportCSV(activeSlug)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
                      <Download size={16} /> Export CSV
                    </button>
                    <button onClick={() => setActiveSlug(null)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-4 overflow-auto">
                  {activeLoading ? (
                    <div className="text-sm">Loading responses…</div>
                  ) : activeError ? (
                    <div className="text-sm text-red-600">{activeError}</div>
                  ) : activeResponses.length === 0 ? (
                    <div className="text-sm">No responses yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium">Sr. No.</th>
                            <th className="px-4 py-2 text-left text-xs font-medium">Submitted At</th>
                            {/* Personal info columns if present */}
                            {(() => {
                              const any = activeResponses[0]?.answers || {};
                              const cols = [] as any[];
                              if (any.name !== undefined) cols.push(<th key="name" className="px-4 py-2 text-left text-xs font-medium">Name</th>);
                              if (any.email !== undefined) cols.push(<th key="email" className="px-4 py-2 text-left text-xs font-medium">Email</th>);
                              if (any.phone !== undefined) cols.push(<th key="phone" className="px-4 py-2 text-left text-xs font-medium">Phone</th>);
                              return cols;
                            })()}
                            {/* Question columns removed; use the View button to see Q&A */}
                            <th className="px-4 py-2 text-left text-xs font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {activeResponses.map((r, idx) => (
                            <tr key={r.id}>
                              <td className="px-4 py-2 text-sm">{idx + 1}</td>
                              <td className="px-4 py-2 text-sm">{r.submittedAt}</td>
                              {(() => {
                                const any = r.answers || {};
                                const cells = [] as any[];
                                if (any.name !== undefined) cells.push(<td key="name" className="px-4 py-2 text-sm">{any.name}</td>);
                                if (any.email !== undefined) cells.push(<td key="email" className="px-4 py-2 text-sm">{any.email}</td>);
                                if (any.phone !== undefined) cells.push(<td key="phone" className="px-4 py-2 text-sm">{any.phone}</td>);
                                return cells;
                              })()}
                              {/* Question cells removed; use the View button to see Q&A */}
                              <td className="px-4 py-2 text-sm">
                                <button className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => openDetail(r)}>View feedback</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      {/* Detail drawer for Q&A view */}
      {detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeDetail}></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feedback #{detail.id}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Question and Answer view</p>
              </div>
              <button onClick={closeDetail} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-4 space-y-3">
              {detail.qas.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No answers recorded.</p>
              ) : (
                detail.qas.map((qa, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{qa.label}</div>
                    <div className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">{qa.value || '-'}</div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button onClick={closeDetail} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

}

export default FeedbackResponses;
