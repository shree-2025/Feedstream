import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
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

interface ResponseItem { id: number; submittedAt: string; answers: Record<string, string> }

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [formsRes, staffRes, subjRes, quesRes] = await Promise.all([
          axios.get('/api/feedback-forms', { params: { page: 1, limit: 100 } }),
          axios.get('/api/staff', { params: { page: 1, limit: 1000 } }),
          axios.get('/api/subjects', { params: { page: 1, limit: 1000 } }),
          axios.get('/api/questions', { params: { page: 1, limit: 1000 } }),
        ]);
        if (!mounted) return;
        const items: ListedForm[] = (formsRes.data?.items || []).map((f: any) => ({
          id: f.id,
          slug: f.slug,
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

        // fetch counts efficiently by requesting limit=1 and using total
        const countPairs = await Promise.all(items.map(async (it) => {
          if (!it.slug) return [it.slug, 0] as const;
          try {
            const r = await axios.get(`/api/feedback-forms/${encodeURIComponent(it.slug)}/responses`, { params: { page: 1, limit: 1 } });
            return [it.slug, Number(r.data?.total || 0)] as const;
          } catch {
            return [it.slug, 0] as const;
          }
        }));
        if (!mounted) return;
        const nextCounts: Record<string, number> = {};
        countPairs.forEach(([slug, c]) => { if (slug) nextCounts[slug] = c; });
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

  const openResponses = async (slug: string) => {
    try {
      setActiveSlug(slug);
      setActiveLoading(true);
      setActiveError(null);
      const r = await axios.get(`/api/feedback-forms/${encodeURIComponent(slug)}/responses`, { params: { page: 1, limit: 100 } });
      const items: ResponseItem[] = (r.data?.items || []);
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

  const exportCSV = (slug: string) => {
    const url = `/api/feedback-forms/${encodeURIComponent(slug)}/responses.csv`;
    toast.loading('Preparing CSV…', { id: `csv-${slug}` });
    // Kick off download in a new tab; close toast shortly after
    window.open(url, '_blank');
    setTimeout(() => toast.success('Download started', { id: `csv-${slug}` }), 800);
  };

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Responses</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">View forms, counts, and responses. Export as CSV.</p>
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
            {Array.from(new Set(forms.map(f => String(f.semester ?? '')))).filter(Boolean).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800">
            <option value="">All Staff</option>
            {staff.map(s => (<option key={s.id} value={String(s.id)}>{s.name}</option>))}
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800">
            <option value="">All Subjects</option>
            {subjects.map(s => (<option key={s.id} value={String(s.id)}>{s.name}</option>))}
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
                        <ListOrdered size={14} /> {counts[f.slug] ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                      <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={() => openResponses(f.slug)} title="View responses">View</button>
                      <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => exportCSV(f.slug)} title="Export CSV">
                        <Download size={16} /> CSV
                      </button>
                      <a className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1" href={`/feedback/${encodeURIComponent(f.slug)}`} target="_blank" rel="noreferrer">
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
                            <th className="px-4 py-2 text-left text-xs font-medium">ID</th>
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
                            {(() => {
                              const form = forms.find(f => f.slug === activeSlug);
                              const qIds = form?.questionIds || [];
                              return qIds.map((qid) => (
                                <th key={qid} className="px-4 py-2 text-left text-xs font-medium">
                                  {questionById.get(qid)?.text || `Q${qid}`}
                                </th>
                              ));
                            })()}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {activeResponses.map(r => (
                            <tr key={r.id}>
                              <td className="px-4 py-2 text-sm">{r.id}</td>
                              <td className="px-4 py-2 text-sm">{r.submittedAt}</td>
                              {(() => {
                                const any = r.answers || {};
                                const cells = [] as any[];
                                if (any.name !== undefined) cells.push(<td key="name" className="px-4 py-2 text-sm">{any.name}</td>);
                                if (any.email !== undefined) cells.push(<td key="email" className="px-4 py-2 text-sm">{any.email}</td>);
                                if (any.phone !== undefined) cells.push(<td key="phone" className="px-4 py-2 text-sm">{any.phone}</td>);
                                return cells;
                              })()}
                              {(() => {
                                const form = forms.find(f => f.slug === activeSlug);
                                const qIds = form?.questionIds || [];
                                return qIds.map((qid) => (
                                  <td key={qid} className="px-4 py-2 text-sm">{r.answers?.[String(qid)] ?? ''}</td>
                                ));
                              })()}
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
      </div>
    </div>
  );
};

export default FeedbackResponses;
