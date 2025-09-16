import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

type Teacher = { id: number; name: string; department?: string | null; subjects?: number[] };
type Subject = { id: number; name: string; department?: string | null; semester?: string | number | null };
type Question = { id: number; text: string };

const CreateFeedbackForm: React.FC = () => {
  const { user } = useAuth();
  const storageKey = useMemo(() => `fb_defaults_${(user as any)?.id || (user as any)?.email || 'anon'}`, [(user as any)?.id, (user as any)?.email]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  // Staff filtered by selected subject (+semester) fetched from backend
  const [subjectStaff, setSubjectStaff] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTeacher, setSelectedTeacher] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // search inputs
  const [teacherSearch, setTeacherSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [staffRes, subjRes, quesRes] = await Promise.all([
          api.get('/staff', { params: { page: 1, limit: 1000 } }),
          api.get('/subjects', { params: { page: 1, limit: 1000 } }),
          api.get('/questions', { params: { page: 1, limit: 1000 } }),
        ]);
        if (!mounted) return;
        setTeachers((staffRes.data?.items || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          department: s.department || null,
          subjects: Array.isArray(s.subjects)
            ? s.subjects.map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n))
            : [],
        })));
        setSubjects((subjRes.data?.items || []).map((s: any) => ({ id: s.id, name: s.name, department: s.department || null, semester: s.semester ?? null })));
        setQuestions((quesRes.data?.items || []).map((q: any) => ({ id: q.id, text: q.text })));

        // hydrate defaults
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.selectedTeacher) setSelectedTeacher(parsed.selectedTeacher);
            if (parsed.selectedSubject) setSelectedSubject(parsed.selectedSubject);
            if (Array.isArray(parsed.selectedQuestions)) setSelectedQuestions(parsed.selectedQuestions);
            if (parsed.selectedSemester !== undefined) setSelectedSemester(parsed.selectedSemester);
            if (parsed.startDate) setStartDate(parsed.startDate);
            if (parsed.endDate) setEndDate(parsed.endDate);
          }
        } catch {}
      } catch (e: any) {
        if (!mounted) return;
        console.error('CreateFeedbackForm load error', e);
        setError(e?.response?.data?.message || 'Failed to load data');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // persist defaults
  useEffect(() => {
    try {
      const payload = { selectedTeacher, selectedSubject, selectedQuestions, selectedSemester, startDate, endDate };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {}
  }, [selectedTeacher, selectedSubject, selectedQuestions, selectedSemester, startDate, endDate, storageKey]);

  // Derived: selected teacher's department
  const selectedTeacherDept = useMemo(() => {
    const t = teachers.find(t => t.id === selectedTeacher);
    return t?.department || null;
  }, [teachers, selectedTeacher]);

  // Filter subjects by optional semester and search (subject-first flow)
  const filteredSubjects = useMemo(() => {
    let list = subjects;
    // Optional semester filter (1..8)
    if (selectedSemester) {
      list = list.filter(s => String(s.semester || '').trim() === String(selectedSemester));
    }
    if (subjectSearch.trim()) list = list.filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase()));
    return list;
  }, [subjects, teachers, selectedTeacher, selectedSemester, subjectSearch]);

  // Filter teachers and questions by search
  // const filteredTeachers = useMemo(() => {
  //   let list = teachers;
  //   if (teacherSearch.trim()) list = list.filter(t => t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || (t.department || '').toLowerCase().includes(teacherSearch.toLowerCase()));
  //   return list;
  // }, [teachers, teacherSearch]);

  const filteredQuestions = useMemo(() => {
    let list = questions;
    if (questionSearch.trim()) list = list.filter(q => q.text.toLowerCase().includes(questionSearch.toLowerCase()));
    return list;
  }, [questions, questionSearch]);

  // Ensure subject remains valid when teacher changes
  useEffect(() => {
    if (!selectedSubject) return;
    if (!filteredSubjects.some(s => s.id === selectedSubject)) setSelectedSubject('');
  }, [filteredSubjects, selectedSubject]);

  // Subject-first: when subject (or semester) changes, fetch staff who teach that subject in this semester
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setSubjectStaff([]);
        if (!selectedSubject) return;
        const params: any = { subjectId: selectedSubject };
        if (selectedSemester) params.semester = String(selectedSemester);
        const res = await api.get('/feedback/meta', { params });
        if (!mounted) return;
        const staffList: Teacher[] = (res.data?.staff || []).map((s: any) => ({ id: Number(s.id), name: String(s.name || `Staff ${s.id}`) }));
        setSubjectStaff(staffList);
        // Ensure currently selected teacher is valid for new subject filter
        if (selectedTeacher && !staffList.some(t => t.id === selectedTeacher)) {
          setSelectedTeacher('');
        }
      } catch {
        if (mounted) setSubjectStaff([]);
      }
    })();
    return () => { mounted = false; };
  }, [selectedSubject, selectedSemester]);

  const handleGenerateLink = async () => {
    if (!(selectedTeacher && selectedSubject && selectedQuestions.length > 0 && startDate && endDate)) {
      alert('Please fill out all fields before generating the link.');
      return;
    }
    try {
      setSubmitting(true);
      setGeneratedUrl(null);
      const res = await api.post('/feedback/simple/forms', {
        teacherId: selectedTeacher,
        subjectId: selectedSubject,
        questionIds: selectedQuestions,
        startDate,
        endDate,
      });
      const createdId = String(res.data?.id || '');
      const slug = res.data?.slug || createdId;
      // Publish immediately so the public page can load the form
      try {
        const pub = await api.post(`/feedback/simple/forms/${encodeURIComponent(createdId)}/publish`, { active: true });
        const share = pub?.data?.url || pub?.data?.shareUrl || '';
        if (share) {
          setGeneratedUrl(share);
          return;
        }
      } catch { /* ignore; fallback to building URL */ }
      const url = `${window.location.origin}/feedback/${encodeURIComponent(slug)}`;
      setGeneratedUrl(url);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create feedback form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create Feedback Form</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-6">
        {loading && (
          <div className="text-sm text-gray-600 dark:text-gray-300">Loading options...</div>
        )}
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        <div>
          <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Staff</label>
          <input
            type="text"
            value={teacherSearch}
            onChange={(e) => setTeacherSearch(e.target.value)}
            placeholder="Search teachers or department..."
            className="mb-2 w-full p-2 border border-gray-200 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            disabled={loading || !!error || !selectedSubject}
          />
          <select id="teacher" value={selectedTeacher} onChange={(e) => setSelectedTeacher(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={loading || !!error || !selectedSubject}>
            <option value="" disabled>{selectedSubject ? 'Choose staff' : 'Select a subject first'}</option>
            {(teacherSearch.trim() ? subjectStaff.filter(t => t.name.toLowerCase().includes(teacherSearch.toLowerCase())) : subjectStaff).map(teacher => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
          {!loading && !error && selectedSubject && subjectStaff.length === 0 && (
            <div className="mt-2 text-xs text-orange-600">No staff found for the selected subject{selectedSemester ? ` in semester ${selectedSemester}` : ''}.</div>
          )}
          {selectedTeacherDept && (
            <div className="mt-1 text-xs text-gray-500">Department: {selectedTeacherDept}</div>
          )}
        </div>

        <div>
          <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester</label>
          <select
            id="semester"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value ? Number(e.target.value) : '')}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={loading || !!error}
          >
            <option value="">All semesters</option>
            {[1,2,3,4,5,6,7,8].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Subject</label>
          <input
            type="text"
            value={subjectSearch}
            onChange={(e) => setSubjectSearch(e.target.value)}
            placeholder={selectedTeacherDept ? `Search subjects in ${selectedTeacherDept}...` : 'Search subjects...'}
            className="mb-2 w-full p-2 border border-gray-200 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            disabled={loading || !!error}
          />
          <select id="subject" value={selectedSubject} onChange={(e) => setSelectedSubject(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={loading || !!error}>
            <option value="" disabled>Choose a subject</option>
            {filteredSubjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
          {!loading && !error && filteredSubjects.length === 0 && (
            <div className="mt-2 text-xs text-orange-600">No subjects found{selectedTeacher ? ' for the selected staff' : ''}{selectedSemester ? ` in semester ${selectedSemester}` : ''}.</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Questions</label>
          <input
            type="text"
            value={questionSearch}
            onChange={(e) => setQuestionSearch(e.target.value)}
            placeholder="Search questions..."
            className="mb-2 w-full p-2 border border-gray-200 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            disabled={loading || !!error}
          />
          <div className="space-y-2">
            {filteredQuestions.map(q => (
              <div key={q.id} className="flex items-center">
                <input 
                  type="checkbox" 
                  id={`q-${q.id}`} 
                  value={q.id} 
                  checked={selectedQuestions.includes(q.id)} 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedQuestions([...selectedQuestions, q.id]);
                    } else {
                      setSelectedQuestions(selectedQuestions.filter(id => id !== q.id));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading || !!error}
                />
                <label htmlFor={`q-${q.id}`} className="ml-3 text-sm text-gray-700 dark:text-gray-300">{q.text}</label>
              </div>
            ))}
          </div>
          {!loading && !error && filteredQuestions.length === 0 && (
            <div className="mt-2 text-xs text-orange-600">No questions found in the Question Bank.</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
            <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {generatedUrl && (
            <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded p-2 text-sm text-gray-800 dark:text-gray-200 break-all">
              {generatedUrl}
            </div>
          )}
          <div className="text-right">
            <button onClick={handleGenerateLink} disabled={loading || !!error || submitting} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Generating…' : 'Generate Link'}
            </button>
            {generatedUrl && (
              <button
                onClick={() => navigator.clipboard.writeText(generatedUrl)}
                className="ml-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
              >
                Copy
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreateFeedbackForm;
