import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

type Question = {
  id: number | string;
  text: string;
  type: 'multiple-choice' | 'text' | 'rating';
  options?: string[];
  required?: boolean;
  multiSelect?: boolean;
  longText?: boolean; // hint from backend: LONG
  asSelect?: boolean; // hint from backend: single-choice but many options → render as <select>
};

type LoadedForm = {
  slug: string;
  id?: number | string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  semester?: string | number | null;
  questionIds?: Array<number | string>;
  questions?: Question[];
  staff?: Array<{ id: number; name: string; departmentId?: number }>;
  subjects?: Array<{ id: number; name: string; code?: string; semester?: string; departmentId?: number }>;
  audience?: string | null;
};

const tryGet = async <T,>(paths: string[]): Promise<T> => {
  let lastErr: any = null;
  for (const p of paths) {
    try {
      const r = await api.get(p);
      return r.data as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};

const tryPost = async (paths: string[], payload: any) => {
  let lastErr: any = null;
  for (const p of paths) {
    try {
      const r = await api.post(p, payload);
      return r.data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};

const FeedbackFormPublic: React.FC = () => {
  const { slug = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<LoadedForm | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // student info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // answers keyed by question id as string
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const isActive = useMemo(() => {
    if (!form) return true;
    const s = form.startDate ? String(form.startDate).slice(0, 10) : '';
    const e = form.endDate ? String(form.endDate).slice(0, 10) : '';
    if (!s || !e) return true; // if dates not set, allow
    const today = new Date().toISOString().slice(0, 10);
    return s <= today && today <= e;
  }, [form]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (!slug) throw new Error('Missing form slug');

        // 1) Try direct-by-slug endpoints first (prefer SIMPLE public endpoint that maps to feedback_master)
        let loaded: LoadedForm | null = null;
        try {
          const paths: string[] = [
            `/feedback/public/simple/${encodeURIComponent(slug)}`,
            `/feedback/public/form/${encodeURIComponent(slug)}`,
            `/feedback/forms/${encodeURIComponent(slug)}`,
            `/feedback-forms/${encodeURIComponent(slug)}`,
          ];
          // Only try "simple details by id" if slug looks numeric, to avoid 404 spam on alpha slugs
          if (/^\d+$/.test(String(slug))) {
            paths.push(`/feedback/simple/forms/${encodeURIComponent(String(slug))}`);
          }
          const data = await tryGet<any>(paths);
          const normalizeType = (t: any): Question['type'] | 'multiple-choice-multi' => {
            const raw = String(t || '').trim();
            const s = raw.toUpperCase();
            // Already UI-normalized types
            if (raw === 'multiple-choice' || s === 'MULTIPLE-CHOICE' || s === 'MULTIPLE_CHOICE' || s === 'MULTIPLECHOICE') return 'multiple-choice';
            if (raw === 'text' || s === 'TEXT' || s === 'SHORT' || s === 'LONG') return 'text';
            if (raw === 'rating' || s === 'RATING' || s === 'NUMERIC') return 'rating';
            // Map DB-ish types
            if (['MCQ','MCQ_SINGLE','TRUE_FALSE','TRUEFALSE','TF','MCQ_S','MCQ_SING'].includes(s)) return 'multiple-choice';
            if (['MCQ_MULTI','MULTI','CHECKBOX','MULTIPLE','MCQ_M'].includes(s)) return 'multiple-choice-multi';
            return 'text';
          };
          const qList = Array.isArray(data?.questions)
            ? data.questions.map((q: any, idx: number) => ({
                id: q.id ?? idx + 1,
                text: (q.text ?? q.question ?? q.label ?? `Question ${idx + 1}`),
                type: ((): Question['type'] => {
                  const t = normalizeType(q.type);
                  return t === 'multiple-choice-multi' ? 'multiple-choice' : t;
                })(),
                options: (() => {
                  const raw = q.options ?? q.choices ?? q.opts ?? [];
                  if (Array.isArray(raw)) return raw.map((x: any) => String(x));
                  if (typeof raw === 'string') {
                    const parts = raw.split(/\r?\n|\||,|;|\t/).map(s => s.trim()).filter(Boolean);
                    return parts;
                  }
                  return [];
                })(),
                required: !!q.required,
                multiSelect: (() => {
                  const t = String(q.type || '').toUpperCase();
                  return ['MCQ_MULTI','MULTI','CHECKBOX','MULTIPLE'].includes(t);
                })(),
                longText: !!q.longText,
                asSelect: !!q.asSelect,
              }))
            : undefined;
          loaded = {
            slug,
            id: data?.id ?? data?.form?.id,
            title: data?.title ?? data?.form?.title,
            description: data?.description ?? data?.form?.description,
            startDate: data?.startDate ?? data?.form?.startDate,
            endDate: data?.endDate ?? data?.form?.endDate,
            semester: data?.semester ?? data?.form?.semester ?? null,
            questionIds: data?.questionIds ?? data?.form?.questionIds ?? [],
            questions: qList,
            staff: Array.isArray(data?.staff) ? data.staff : undefined,
            subjects: Array.isArray(data?.subjects) ? data.subjects : undefined,
            audience: data?.audience ?? null,
          };
        } catch {
          // ignore; will attempt list fallback next
        }

        // 2) If direct failed or missing info, fallback to list endpoint and find by slug
        if (!loaded || !loaded.id || (!loaded.questions && (!loaded.questionIds || loaded.questionIds.length === 0))) {
          try {
            const listTry = await api.get('/feedback/simple/forms', { params: { slug: String(slug), page: 1, limit: 100 } });
            const items = Array.isArray(listTry?.data?.items) ? listTry.data.items : [];
            let item = items.find((it: any) => String(it.slug || '').trim() === String(slug).trim()
              || String(it.id || '').trim() === String(slug).trim()
              || (typeof it.shareUrl === 'string' && it.shareUrl.includes(String(slug))));
            if (!item) {
              const listAll = await api.get('/feedback/simple/forms', { params: { page: 1, limit: 1000 } });
              const all = Array.isArray(listAll?.data?.items) ? listAll.data.items : [];
              item = all.find((it: any) => String(it.slug || '').trim() === String(slug).trim()
                || String(it.id || '').trim() === String(slug).trim()
                || (typeof it.shareUrl === 'string' && it.shareUrl.includes(String(slug))));
            }
            if (item) {
              loaded = loaded || { slug };
              loaded.id = item.id ?? loaded.id;
              loaded.title = item.title ?? loaded.title;
              loaded.description = item.description ?? loaded.description;
              loaded.startDate = item.startDate ?? loaded.startDate;
              loaded.endDate = item.endDate ?? loaded.endDate;
              loaded.semester = item.semester ?? loaded.semester;
              loaded.questionIds = item.questionIds ?? loaded.questionIds ?? [];
            }
          } catch { /* ignore */ }
        }

        if (!loaded || !loaded.id) {
          throw new Error('Form not found or inactive');
        }

        // If questions array isn't present, attempt to hydrate by fetching question bank and filtering by ids
        let qList: Question[] = [];
        if (Array.isArray(loaded.questions) && loaded.questions.length > 0) {
          qList = loaded.questions;
        } else if (Array.isArray(loaded.questionIds) && loaded.questionIds.length > 0) {
          try {
            const qb = await api.get('/questions', { params: { page: 1, limit: 1000 } });
            const all = (qb.data?.items || []).map((q: any, idx: number) => {
              const raw = String(q.type || '').trim();
              const s = raw.toUpperCase();
              const isMulti = ['MCQ_MULTI','MULTI','CHECKBOX','MULTIPLE','MCQ_M'].includes(s);
              const type: Question['type'] = (
                raw === 'multiple-choice' || ['MCQ','MCQ_SINGLE','TRUE_FALSE','TRUEFALSE','TF','MCQ_S','MCQ_SING','MCQ_MULTI','MULTI','CHECKBOX','MULTIPLE','MCQ_M'].includes(s)
              ) ? 'multiple-choice' : ((raw === 'rating' || s === 'RATING' || s === 'NUMERIC') ? 'rating' : 'text');
              const optsRaw = q.options ?? q.choices ?? q.opts ?? [];
              const options = Array.isArray(optsRaw) ? optsRaw.map((x: any) => String(x))
                : (typeof optsRaw === 'string' ? optsRaw.split(/\r?\n|\||,|;|\t/).map((t: string) => t.trim()).filter(Boolean) : []);
              return {
                id: q.id ?? idx + 1,
                text: q.text ?? q.question ?? q.label ?? `Question ${idx + 1}`,
                type,
                options,
                required: !!q.required,
                multiSelect: isMulti,
                longText: String(q.type || '').toUpperCase() === 'LONG',
                asSelect: (!isMulti && type === 'multiple-choice' && options.length > 6),
              } as Question;
            });
            const setIds = new Set((loaded.questionIds || []).map((x) => String(x)));
            qList = all.filter((q: Question) => setIds.has(String(q.id)));
          } catch { /* ignore */ }
        }

        // If we have questions but some are missing options or types, try to enrich from question bank by ID
        if (qList.length > 0 && qList.some(q => q.type === 'multiple-choice' && (!q.options || q.options.length === 0))) {
          try {
            const qb = await api.get('/questions', { params: { page: 1, limit: 1000 } });
            const byId: Record<string, any> = {};
            for (const q of (qb.data?.items || [])) byId[String(q.id)] = q;
            qList = qList.map(q => {
              if (q.options && q.options.length) return q;
              const src = byId[String(q.id)];
              if (!src) return q;
              const optsRaw = src.options ?? src.choices ?? src.opts ?? [];
              const options = Array.isArray(optsRaw) ? optsRaw.map((x: any) => String(x))
                : (typeof optsRaw === 'string' ? optsRaw.split(/\r?\n|\||,|;|\t/).map((t: string) => t.trim()).filter(Boolean) : []);
              return { ...q, options };
            });
          } catch { /* ignore */ }
        }

        if (!mounted) return;
        setForm(loaded);
        setQuestions(qList);
        toast.success('Feedback loaded');
      } catch (e: any) {
        if (!mounted) return;
        const msg = e?.response?.data?.message || e?.message || 'Failed to load feedback form';
        setError(msg);
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!isActive) {
      toast.error('This form is not accepting responses at the moment.');
      return;
    }
    // basic validation
    if (!name.trim() || !email.trim()) {
      toast.error('Please provide your name and email.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        answers: { ...answers },
      };

      await tryPost([
        // Preferred SIMPLE route backed by feedback_master
        `/feedback/public/simple/${encodeURIComponent(slug)}/submit`,
        // Alternate modern route
        `/feedback/public/form/${encodeURIComponent(slug)}/responses`,
        `/feedback/forms/${encodeURIComponent(slug)}/responses`,
        // Legacy route
        `/feedback-forms/${encodeURIComponent(slug)}/responses`,
      ], payload);

      toast.success('Thank you! Your feedback has been submitted.');
      // reset answers but keep identity for convenience
      setAnswers({});
      // Close tab/window if allowed by the browser; otherwise, do nothing (user stays on the page)
      setTimeout(() => {
        try { window.close(); } catch {}
      }, 800);
    } catch (e: any) {
      // Show a friendly duplicate-email message when backend enforces 1 response per email
      const status = e?.response?.status;
      if (status === 409) {
        // Show the exact message the user requested
        const dupMsg = 'This Email is already use please use new email';
        toast.error(dupMsg);
        setError(dupMsg);
      } else {
        const msg = e?.response?.data?.message || 'This Email is already use please use new email';
        toast.error(msg);
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (q: Question) => {
    const qid = String(q.id);
    if (q.type === 'text') {
      if (q.longText) {
        return (
          <textarea
            className="w-full p-2 border rounded-lg"
            rows={4}
            placeholder="Enter your response"
            value={answers[qid] ?? ''}
            onChange={(e) => setAnswers(prev => ({ ...prev, [qid]: e.target.value }))}
          />
        );
      }
      return (
        <input
          className="w-full p-2 border rounded-lg"
          placeholder="Enter your response"
          value={answers[qid] ?? ''}
          onChange={(e) => setAnswers(prev => ({ ...prev, [qid]: e.target.value }))}
        />
      );
    }
    if (q.type === 'rating') {
      const opts = (Array.isArray(q.options) && q.options.length > 0) ? q.options : ['1','2','3','4','5'];
      const sel = String(answers[qid] ?? '');
      return (
        <div className="flex items-center gap-2 flex-wrap">
          {opts.map((label, idx) => (
            <button
              key={`${qid}-${idx}`}
              type="button"
              className={`px-3 py-1 rounded border ${sel === String(label) ? 'bg-blue-600 text-white' : 'bg-white'}`}
              onClick={() => setAnswers(prev => ({ ...prev, [qid]: String(label) }))}
            >{label}</button>
          ))}
        </div>
      );
    }
    // multiple-choice
    const opts = Array.isArray(q.options) ? q.options : [];
    // Render as <select> if hinted and not multi-select
    if (q.asSelect && !q.multiSelect) {
      const selected = answers[qid] ?? '';
      return (
        <select
          className="w-full p-2 border rounded-lg"
          value={selected}
          onChange={(e) => setAnswers(prev => ({ ...prev, [qid]: e.target.value }))}
        >
          <option value="">Select an option</option>
          {opts.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    if (q.multiSelect) {
      const selection: string[] = Array.isArray(answers[qid]) ? answers[qid] : [];
      const toggle = (opt: string) => {
        const set = new Set(selection.map(String));
        if (set.has(String(opt))) set.delete(String(opt)); else set.add(String(opt));
        setAnswers(prev => ({ ...prev, [qid]: Array.from(set) }));
      };
      return (
        <div className="space-y-2">
          {opts.map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={`q-${qid}`}
                value={opt}
                checked={selection.map(String).includes(String(opt))}
                onChange={() => toggle(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
    }
    const selected = answers[qid] ?? '';
    return (
      <div className="space-y-2">
        {opts.map((opt, i) => (
          <label key={i} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`q-${qid}`}
              value={opt}
              checked={String(selected) === String(opt)}
              onChange={() => setAnswers(prev => ({ ...prev, [qid]: opt }))}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow border border-gray-200 p-6">
        {loading ? (
          <div>Loading form…</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : !form ? (
          <div>Form not found.</div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{form.title || 'Feedback'}</h1>
              {form.description && (
                <p className="text-sm text-gray-600 mt-1">{form.description}</p>
              )}
              <div className="mt-2 text-xs">
                {isActive ? (
                  <span className="px-2 py-1 rounded bg-green-100 text-green-800 border border-green-200">Open</span>
                ) : (
                  <span className="px-2 py-1 rounded bg-red-100 text-red-800 border border-red-200">Closed</span>
                )}
              </div>
              {/* Context: staff / subject / semester */}
              <div className="mt-3 text-sm text-gray-700 space-y-1">
                {Array.isArray(form.staff) && form.staff.length > 0 && (
                  <div>
                    <span className="font-semibold">Staff:</span> {form.staff.map(s => s.name).join(', ')}
                  </div>
                )}
                {Array.isArray(form.subjects) && form.subjects.length > 0 && (
                  <div>
                    <span className="font-semibold">Subjects:</span> {form.subjects.map(s => s.name).join(', ')}
                  </div>
                )}
                {(form.semester || form.audience) && (
                  <div className="text-xs text-gray-500">
                    {form.semester ? <>Semester: {String(form.semester)} </> : null}
                    {form.audience ? <>• Audience: {form.audience}</> : null}
                  </div>
                )}
                {(form.startDate || form.endDate) && (
                  <div className="text-xs text-gray-500">
                    Available: {form.startDate || '—'} to {form.endDate || '—'}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Student Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input className="w-full p-2 border rounded-lg" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input type="email" className="w-full p-2 border rounded-lg" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input className="w-full p-2 border rounded-lg" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <div className="text-sm text-gray-500">No questions configured.</div>
                ) : questions.map((q, idx) => (
                  <div key={String(q.id)}>
                    <label className="block text-sm font-medium mb-1">{idx + 1}. {q.text} {q.required ? <span className="text-red-600">*</span> : null}</label>
                    {renderQuestion(q)}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !isActive}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
export default FeedbackFormPublic;
