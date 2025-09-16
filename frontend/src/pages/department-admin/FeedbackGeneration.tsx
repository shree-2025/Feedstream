import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Plus, Eye, Link, Edit, Trash2, Save, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text' | 'rating';
  options?: string[];
  required: boolean;
}

interface Staff {
  id: string;
  name: string;
  email?: string;
  department?: string;
  subjects?: string[]; // assigned subject IDs
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  department?: string;
  semester?: string;
}

interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  selectedStaff: Staff[];
  selectedSubjects: Subject[];
  semester: string; // values: '1'..'8'
  startDate: string;
  endDate: string;
  targetAudience: 'students' | 'parents' | 'staff';
  isActive: boolean;
  status?: string;
  createdAt: string;
  formLink: string;
}

const FeedbackGeneration: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [listsError, setListsError] = useState<string | null>(null);

  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [formsError, setFormsError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filter: show only active forms when coming from dashboard (?active=1)
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wantActive = params.get('active');
    setShowOnlyActive(wantActive === '1' || wantActive === 'true');
  }, [location.search]);

  const activeCount = forms.filter(f => f.isActive).length;
  const displayedForms = showOnlyActive ? forms.filter(f => f.isActive) : forms;
  // Confirm delete modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewForm, setPreviewForm] = useState<FeedbackForm | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FeedbackForm> & { id?: string }>({});

  const [newForm, setNewForm] = useState<Partial<FeedbackForm>>({
    title: '',
    description: '',
    questions: [],
    selectedStaff: [],
    selectedSubjects: [],
    semester: '',
    startDate: '',
    endDate: '',
    targetAudience: 'students',
  });

  // Optional college branding for public form header
  const [branding, setBranding] = useState<{ collegeName: string; collegeLogoUrl: string }>({
    collegeName: (user as any)?.collegeName || '',
    collegeLogoUrl: (user as any)?.collegeLogoUrl || '',
  });

  useEffect(() => {
    // When opening the create modal, initialize branding from user profile if available
    if (showCreateForm) {
      setBranding({
        collegeName: (user as any)?.collegeName || '',
        collegeLogoUrl: (user as any)?.collegeLogoUrl || '',
      });
    }
  }, [showCreateForm, user]);

  // Load staff, subjects, and questions when the Create Form modal opens
  useEffect(() => {
    let mounted = true;
    async function loadLists() {
      if (!showCreateForm) return;
      try {
        setLoadingLists(true);
        setListsError(null);
        const [staffRes, subjRes, quesRes] = await Promise.all([
          api.get('/staff', { params: { page: 1, limit: 1000 } }),
          api.get('/subjects', { params: { page: 1, limit: 1000 } }),
          api.get('/questions', { params: { page: 1, limit: 1000 } }),
        ]);
        if (!mounted) return;
        const staffList: Staff[] = (staffRes.data?.items || []).map((s: any) => {
          let subjIds: string[] = [];
          const extractId = (x: any) => {
            if (x == null) return null;
            if (typeof x === 'object') {
              const val = x.id ?? x.subjectId ?? x.subject_id ?? null;
              return val != null ? String(val) : null;
            }
            return String(x).trim();
          };
          if (Array.isArray(s.subjects)) {
            subjIds = s.subjects.map(extractId).filter((v: any) => v != null) as string[];
          } else if (typeof s.subjects === 'string' && s.subjects.trim()) {
            try {
              const parsed = JSON.parse(s.subjects);
              if (Array.isArray(parsed)) subjIds = parsed.map(extractId).filter((v: any) => v != null) as string[];
            } catch {
              // Fallback: CSV like "1,2,3"
              subjIds = s.subjects.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
            }
          }
          return {
            id: String(s.id),
            name: s.name,
            email: s.email,
            department: s.department,
            subjects: subjIds,
          } as Staff;
        });
        const subjectList: Subject[] = (subjRes.data?.items || []).map((s: any) => ({
          id: String(s.id),
          name: s.name,
          code: s.code,
          department: s.department,
          semester: s.semester,
        }));
        const questionList: Question[] = (quesRes.data?.items || []).map((q: any) => ({
          id: String(q.id),
          text: q.text,
          type: q.type,
          options: q.options || undefined,
          required: !!q.required,
        }));
        // Set base lists
        setStaff(staffList);
        setSubjects(subjectList);
        setQuestions(questionList);

        // Load existing forms after base lists (so we can map IDs nicely if needed)
        try {
          const formsRes = await api.get('/feedback/simple/forms', { params: { page: 1, limit: 100 } });
          if (mounted) {
            const items = (formsRes.data?.items || []) as Array<any>;
            const mapped: FeedbackForm[] = items.map((f) => {
              const tId = String((Array.isArray(f.staffIds) && f.staffIds[0] != null) ? f.staffIds[0] : '');
              const sId = String((Array.isArray(f.subjectIds) && f.subjectIds[0] != null) ? f.subjectIds[0] : '');
              const staffObj = staffList.find(x => x.id === tId) || (tId ? { id: tId, name: `Staff ${tId}` } as Staff : { id: '', name: '' } as Staff);
              const subjObj = subjectList.find(x => x.id === sId) || (sId ? { id: sId, name: `Subject ${sId}` } as Subject : { id: '', name: '' } as Subject);
              const qIdsStr = (Array.isArray(f.questions) ? f.questions : []).map((x: any) => String(typeof x === 'object' ? x.id : x));
              const qObjs = questionList.filter(q => qIdsStr.includes(String(q.id)));
              const computeActive = (): boolean => {
                if (typeof f.isActive === 'boolean') return f.isActive;
                const today = new Date().toISOString().slice(0, 10);
                const byStatus = String(f.status || '').toLowerCase() === 'active';
                const byDate = (f.startDate && f.endDate)
                  ? (today >= String(f.startDate).slice(0, 10) && today <= String(f.endDate).slice(0, 10))
                  : false;
                return byStatus || byDate;
              };
              return {
                id: String(f.id),
                title: f.title || '',
                description: f.description || '',
                questions: qObjs,
                selectedStaff: staffObj.id ? [staffObj] : [],
                selectedSubjects: subjObj.id ? [subjObj] : [],
                semester: String(f.semester || ''),
                startDate: f.startDate,
                endDate: f.endDate,
                targetAudience: 'students',
                isActive: computeActive(),
                status: f.status,
                createdAt: f.createdAt,
                formLink: f.shareUrl || '',
              } as FeedbackForm;
            });
            setForms(mapped);
          }
        } catch (e) {
          // Non-fatal: listing forms might not be available
        }
      } catch (e: any) {
        if (!mounted) return;
        console.error('Failed to load lists for Create Form modal', e);
        setListsError(e?.response?.data?.message || 'Failed to load data');
      } finally {
        if (mounted) setLoadingLists(false);
      }
    }
    loadLists();
    return () => { mounted = false; };
  }, [showCreateForm]);

  // Initial page load: fetch base lists (if empty) and existing forms so the page shows data without opening modal
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingForms(true);
        setFormsError(null);

        // Prepare local copies; fetch only if missing
        let staffList = staff;
        let subjectList = subjects;
        let questionList = questions;

        if (staffList.length === 0 || subjectList.length === 0 || questionList.length === 0) {
          try {
            const [staffRes, subjRes, quesRes] = await Promise.all([
              staffList.length === 0 ? api.get('/staff', { params: { page: 1, limit: 1000 } }) : Promise.resolve({ data: { items: [] } }),
              subjectList.length === 0 ? api.get('/subjects', { params: { page: 1, limit: 1000 } }) : Promise.resolve({ data: { items: [] } }),
              questionList.length === 0 ? api.get('/questions', { params: { page: 1, limit: 1000 } }) : Promise.resolve({ data: { items: [] } }),
            ]);

            if (!mounted) return;

            if (staffList.length === 0) {
              const mappedStaff: Staff[] = (staffRes.data?.items || []).map((s: any) => {
                let subjIds: string[] = [];
                const extractId = (x: any) => {
                  if (x == null) return null;
                  if (typeof x === 'object') {
                    const val = x.id ?? x.subjectId ?? x.subject_id ?? null;
                    return val != null ? String(val) : null;
                  }
                  return String(x).trim();
                };
                if (Array.isArray(s.subjects)) {
                  subjIds = s.subjects.map(extractId).filter((v: any) => v != null) as string[];
                } else if (typeof s.subjects === 'string' && s.subjects.trim()) {
                  try {
                    const parsed = JSON.parse(s.subjects);
                    if (Array.isArray(parsed)) subjIds = parsed.map(extractId).filter((v: any) => v != null) as string[];
                  } catch {
                    subjIds = s.subjects.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
                  }
                }
                return { id: String(s.id), name: s.name, email: s.email, department: s.department, subjects: subjIds } as Staff;
              });
              staffList = mappedStaff;
              setStaff(mappedStaff);
            }

            if (subjectList.length === 0) {
              const mappedSubjects: Subject[] = (subjRes.data?.items || []).map((s: any) => ({
                id: String(s.id),
                name: s.name,
                code: s.code,
                department: s.department,
                semester: s.semester,
              }));
              subjectList = mappedSubjects;
              setSubjects(mappedSubjects);
            }

            if (questionList.length === 0) {
              const mappedQuestions: Question[] = (quesRes.data?.items || []).map((q: any) => ({
                id: String(q.id),
                text: q.text,
                type: q.type,
                options: q.options || undefined,
                required: !!q.required,
              }));
              questionList = mappedQuestions;
              setQuestions(mappedQuestions);
            }
          } catch (e: any) {
            if (!mounted) return;
            // Non-fatal; still attempt to load forms even if lists fail
          }
        }

        // Load existing forms for the page
        try {
          const formsRes = await api.get('/feedback/simple/forms', { params: { page: 1, limit: 100 } });
          if (!mounted) return;
          const items = (formsRes.data?.items || []) as Array<any>;
          const mapped: FeedbackForm[] = items.map((f) => {
            const tId = String((Array.isArray(f.staffIds) && f.staffIds[0] != null) ? f.staffIds[0] : '');
            const sId = String((Array.isArray(f.subjectIds) && f.subjectIds[0] != null) ? f.subjectIds[0] : '');
            const staffObj = staffList.find(x => x.id === tId) || (tId ? { id: tId, name: `Staff ${tId}` } as Staff : { id: '', name: '' } as Staff);
            const subjObj = subjectList.find(x => x.id === sId) || (sId ? { id: sId, name: `Subject ${sId}` } as Subject : { id: '', name: '' } as Subject);
            const qIdsStr = (Array.isArray(f.questions) ? f.questions : []).map((x: any) => String(typeof x === 'object' ? x.id : x));
            const qObjs = questionList.filter(q => qIdsStr.includes(String(q.id)));
            const computeActive = (): boolean => {
              if (typeof f.isActive === 'boolean') return f.isActive;
              const today = new Date().toISOString().slice(0, 10);
              const byStatus = String(f.status || '').toLowerCase() === 'active';
              const byDate = (f.startDate && f.endDate)
                ? (today >= String(f.startDate).slice(0, 10) && today <= String(f.endDate).slice(0, 10))
                : false;
              return byStatus || byDate;
            };
            return {
              id: String(f.id),
              title: f.title || `${subjObj.name} - ${staffObj.name}`,
              description: f.description || '',
              questions: qObjs,
              selectedStaff: staffObj.id ? [staffObj] : [],
              selectedSubjects: subjObj.id ? [subjObj] : [],
              semester: String(f.semester || ''),
              startDate: f.startDate,
              endDate: f.endDate,
              targetAudience: 'students',
              isActive: computeActive(),
              status: f.status,
              createdAt: f.createdAt,
              formLink: f.shareUrl || '',
            } as FeedbackForm;
          });
          setForms(mapped);
        } catch (e: any) {
          if (!mounted) return;
          setFormsError(e?.response?.data?.message || 'Failed to load existing forms');
        }
      } finally {
        if (mounted) setLoadingForms(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const semesters = ['1','2','3','4','5','6','7','8'];
  const audiences = [
    { value: 'students', label: 'Students' },
    { value: 'parents', label: 'Parents' },
    { value: 'staff', label: 'Staff' },
  ];

  // Derived: Subjects filtered by semester only
  const filteredSubjects = React.useMemo(() => {
    let list = subjects;
    if (newForm.semester) {
      list = list.filter(sub => String(sub.semester || '').trim() === String(newForm.semester));
    }
    return list;
  }, [subjects, newForm.semester]);

  // Derived: Staff filtered by selected subject assignment
  const selectedSubjectId = (newForm.selectedSubjects && newForm.selectedSubjects[0]?.id) || '';
  const selectedSubjectObj = React.useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);
  const filteredStaffBySubject = React.useMemo(() => {
    if (!selectedSubjectId) return staff;
    const sub = selectedSubjectObj;
    // If staff objects lack a populated `subjects` array, assume the backend already filtered by subject via /feedback/meta
    const anyHasSubjects = staff.some(x => Array.isArray(x.subjects) && x.subjects.length > 0);
    if (!anyHasSubjects) return staff;
    return staff.filter(s => (s.subjects || []).some(val => {
      const v = String(val);
      return v === String(selectedSubjectId)
        || (sub?.code ? v === String(sub.code) : false)
        || (sub?.name ? v === String(sub.name) : false);
    }));
  }, [staff, selectedSubjectId, selectedSubjectObj]);

  // Keep selectedSubjects in sync with semester filter
  useEffect(() => {
    if (!newForm.selectedSubjects || newForm.selectedSubjects.length === 0) return;
    const allowed = new Set(filteredSubjects.map(s => s.id));
    const pruned = newForm.selectedSubjects.filter(s => allowed.has(s.id));
    if (pruned.length !== newForm.selectedSubjects.length) {
      setNewForm({ ...newForm, selectedSubjects: pruned });
    }
  }, [filteredSubjects]);

  // Keep selectedStaff in sync with selected subject
  useEffect(() => {
    if (!newForm.selectedStaff || newForm.selectedStaff.length === 0) return;
    if (!selectedSubjectId) return;
    const allowed = new Set(filteredStaffBySubject.map(s => s.id));
    const pruned = newForm.selectedStaff.filter(s => allowed.has(s.id));
    if (pruned.length !== newForm.selectedStaff.length) {
      setNewForm({ ...newForm, selectedStaff: pruned });
    }
  }, [filteredStaffBySubject, selectedSubjectId]);

  // Date objects for date pickers
  const startDateObj = newForm.startDate ? new Date(newForm.startDate) : null;
  const endDateObj = newForm.endDate ? new Date(newForm.endDate) : null;

  const handleCreateForm = async () => {
    // Validate required fields
    const staffId = newForm.selectedStaff && newForm.selectedStaff[0]?.id;
    const subjectId = newForm.selectedSubjects && newForm.selectedSubjects[0]?.id;
    if (!newForm.title || !newForm.description || !newForm.semester || !newForm.startDate || !newForm.endDate || !staffId || !subjectId || !newForm.questions || newForm.questions.length === 0) {
      toast.error('Please fill all required fields and choose subject, staff and at least one question.');
      return;
    }

    try {
      const payload = {
        title: newForm.title,
        semester: newForm.semester,
        description: newForm.description || '',
        startDate: newForm.startDate,
        endDate: newForm.endDate,
        audience: newForm.targetAudience,
        staffIds: [Number(staffId)],
        subjectIds: [Number(subjectId)],
        questions: (newForm.questions || []).map(q => Number(q.id)),
        isActive: true,
      } as any;
      const res = await api.post('/feedback/simple/forms', payload);

      const slug: string = res.data?.slug;
      const createdAt: string = res.data?.createdAt || new Date().toISOString();
      const statusFromApi: string | undefined = res.data?.status || undefined;
      const isActiveFromApi: boolean | undefined = typeof res.data?.isActive === 'boolean' ? res.data.isActive : undefined;
      const newListedForm: FeedbackForm = {
        id: String(res.data?.id || Date.now()),
        title: newForm.title!,
        description: newForm.description!,
        questions: newForm.questions!,
        selectedStaff: newForm.selectedStaff!,
        selectedSubjects: newForm.selectedSubjects!,
        semester: newForm.semester!,
        startDate: newForm.startDate!,
        endDate: newForm.endDate!,
        targetAudience: newForm.targetAudience!,
        isActive: (isActiveFromApi !== undefined) ? isActiveFromApi : (() => {
          const today = new Date().toISOString().slice(0, 10);
          const byStatus = String(statusFromApi || '').toLowerCase() === 'active';
          const byDate = (!!newForm.startDate && !!newForm.endDate)
            ? (today >= newForm.startDate.slice(0, 10) && today <= newForm.endDate.slice(0, 10))
            : false;
          return byStatus || byDate;
        })(),
        status: statusFromApi,
        createdAt,
        formLink: (() => {
          if (!slug) return '';
          const base = `${window.location.origin}/feedback/${slug}`;
          const qp: string[] = [];
          if (branding.collegeName) qp.push(`collegeName=${encodeURIComponent(branding.collegeName)}`);
          if (branding.collegeLogoUrl) qp.push(`collegeLogo=${encodeURIComponent(branding.collegeLogoUrl)}`);
          return qp.length ? `${base}?${qp.join('&')}` : base;
        })(),
      };

      setForms(prev => [...prev, newListedForm]);
      setNewForm({
        title: '',
        description: '',
        questions: [],
        selectedStaff: [],
        selectedSubjects: [],
        semester: '',
        startDate: '',
        endDate: '',
        targetAudience: 'students',
      });
      setBranding({ collegeName: (user as any)?.collegeName || '', collegeLogoUrl: (user as any)?.collegeLogoUrl || '' });
      setShowCreateForm(false);
      // Auto-publish to get shareable link stored in DB
      try {
        const pub = await api.post(`/feedback/simple/forms/${String(res.data?.id)}/publish`, { active: true });
        if (pub.data?.url) {
          toast.success('Form published');
        }
      } catch {}

    } catch (e: any) {
      console.error('Failed to create feedback form', e);
      toast.error(e?.response?.data?.message || 'Failed to create feedback form');
    }
  };

  const handleQuestionToggle = (question: Question) => {
    const isSelected = newForm.questions?.some(q => q.id === question.id);
    if (isSelected) {
      setNewForm({
        ...newForm,
        questions: newForm.questions?.filter(q => q.id !== question.id),
      });
    } else {
      setNewForm({
        ...newForm,
        questions: [...(newForm.questions || []), question],
      });
    }
  };

  const handlePreview = (form: FeedbackForm) => {
    setPreviewForm(form);
    setShowPreview(true);
  };

  const handleEditQuestion = (questionId: string, newText: string) => {
    if (newForm.questions) {
      const updatedQuestions = newForm.questions.map(q =>
        q.id === questionId ? { ...q, text: newText } : q
      );
      setNewForm({ ...newForm, questions: updatedQuestions });
    }
    setEditingQuestion(null);
  };

  const copyFormLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Form link copied');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const openEditForm = (form: FeedbackForm) => {
    setEditForm({ ...form });
    setShowEditForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm || !editForm.id) return;
    const staffId = editForm.selectedStaff && editForm.selectedStaff[0]?.id;
    const subjectId = editForm.selectedSubjects && editForm.selectedSubjects[0]?.id;
    if (!staffId || !subjectId || !editForm.startDate || !editForm.endDate || !editForm.questions || editForm.questions.length === 0) {
      toast.error('Please ensure subject, staff, dates, and at least one question are set.');
      return;
    }
    try {
      const payload = {
        title: editForm.title,
        semester: editForm.semester,
        description: editForm.description || '',
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        audience: editForm.targetAudience || 'students',
        staffIds: [Number(staffId)],
        subjectIds: [Number(subjectId)],
        questions: editForm.questions.map(q => Number(q.id)).filter(n => Number.isFinite(n)),
        isActive: true,
      } as any;
      await api.put(`/feedback/simple/forms/${editForm.id}`, payload);

      // Update local list
      setForms(prev => prev.map(f => f.id === editForm.id ? {
        ...f,
        selectedStaff: editForm.selectedStaff || f.selectedStaff,
        selectedSubjects: editForm.selectedSubjects || f.selectedSubjects,
        questions: editForm.questions || f.questions,
        startDate: editForm.startDate || f.startDate,
        endDate: editForm.endDate || f.endDate,
        semester: (editForm.semester ?? f.semester) as string,
        title: (editForm.title ?? f.title) as string,
        description: (editForm.description ?? f.description) as string,
      } : f));
      setShowEditForm(false);
    } catch (e: any) {
      console.error('Failed to update feedback form', e);
      toast.error(e?.response?.data?.message || 'Failed to update feedback form');
    }
  };

  const toggleFormStatus = async (formId: string) => {
    const current = forms.find(f => f.id === formId);
    if (!current) return;
    const nextActive = !current.isActive;
    // Optimistic update
    setForms(prev => prev.map(f => (f.id === formId ? { ...f, isActive: nextActive } : f)));
    try {
      setTogglingId(formId);
      await api.post(`/feedback/simple/forms/${encodeURIComponent(formId)}/publish`, { active: nextActive });
      toast.success(nextActive ? 'Form activated' : 'Form deactivated');
      // Refresh from server to fully sync
      try {
        const resp = await api.get('/feedback/simple/forms', { params: { page: 1, limit: 100 } });
        const items = resp?.data?.items || [];
        const fresh = items.find((it: any) => String(it.id) === String(formId));
        if (fresh) {
          setForms(prev => prev.map(f => (
            f.id === String(formId)
              ? {
                  ...f,
                  isActive: typeof fresh.isActive === 'boolean' ? fresh.isActive : f.isActive,
                  status: fresh.status ?? f.status,
                  formLink: fresh.shareUrl || f.formLink,
                  title: fresh.title ?? f.title,
                  semester: String(fresh.semester ?? f.semester),
                }
              : f
          )));
        }
      } catch {}
    } catch (e: any) {
      // Revert on failure
      setForms(prev => prev.map(f => (f.id === formId ? { ...f, isActive: !nextActive } : f)));
      const msg = e?.response?.data?.message || 'Failed to update form status';
      toast.error(msg);
    } finally {
      setTogglingId(prev => (prev === formId ? null : prev));
    }
  };

  const deleteForm = (formId: string) => {
    setConfirmDeleteId(formId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) { setConfirmOpen(false); return; }
    try {
      await api.delete(`/feedback/simple/forms/${encodeURIComponent(confirmDeleteId)}`);
      setForms(prev => prev.filter(f => f.id !== confirmDeleteId));
      toast.success('Feedback form deleted');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to delete feedback form';
      toast.error(msg);
    } finally {
      setConfirmOpen(false);
      setConfirmDeleteId(null);
    }
  };

  // When semester changes: fetch subjects for that semester; clear staff and any selections
  useEffect(() => {
    let active = true;
    (async () => {
      const semester = newForm.semester;
      if (!semester) {
        setSubjects([]);
        setStaff([]);
        setNewForm({ ...newForm, selectedSubjects: [], selectedStaff: [] });
        return;
      }
      try {
        const res = await api.get('/feedback/meta', { params: { semester } });
        if (!active) return;
        const subjList: Subject[] = (res.data?.subjects || []).map((s: any) => ({ id: String(s.id), name: s.name, code: s.code, department: s.department, semester: s.semester }));
        setSubjects(subjList);
        // Clear staff until a subject is chosen
        setStaff([]);
        setNewForm({ ...newForm, selectedSubjects: [], selectedStaff: [] });
      } catch (e) {
        // ignore
      }
    })();
    return () => { active = false; };
  }, [newForm.semester]);

  // Note: Questions are no longer filtered by subject. We keep the full Question Bank loaded.

  // Dynamic: when subject changes, also refetch staff allowed for that subject (and current semester)
  useEffect(() => {
    let active = true;
    (async () => {
      const sid = (newForm.selectedSubjects && newForm.selectedSubjects[0]?.id) || '';
      const semester = newForm.semester;
      if (!sid) return;
      try {
        const res = await api.get('/feedback/meta', { params: { subjectId: sid, semester } });
        if (!active) return;
        const staffList: Staff[] = (res.data?.staff || []).map((s: any) => ({ id: String(s.id), name: s.name }));
        setStaff(staffList);
        // prune selected staff if no longer valid
        if (newForm.selectedStaff && newForm.selectedStaff.length) {
          const allowed = new Set(staffList.map(s => s.id));
          const pruned = newForm.selectedStaff.filter(s => allowed.has(s.id));
          if (pruned.length !== newForm.selectedStaff.length) {
            setNewForm({ ...newForm, selectedStaff: pruned });
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { active = false; };
  }, [newForm.selectedSubjects, newForm.semester]);

  // Dynamic: when staff changes, refetch subjects for selected semester constrained to that staff
  useEffect(() => {
    let active = true;
    (async () => {
      const semester = newForm.semester;
      const staffId = (newForm.selectedStaff && newForm.selectedStaff[0]?.id) || '';
      if (!semester || !staffId) return;
      try {
        const res = await api.get('/feedback/meta', { params: { semester, staffId } });
        if (!active) return;
        const subjList: Subject[] = (res.data?.subjects || []).map((s: any) => ({ id: String(s.id), name: s.name, code: s.code, department: s.department, semester: s.semester }));
        setSubjects(subjList);
        // prune selected subject if it's no longer applicable
        if (newForm.selectedSubjects && newForm.selectedSubjects.length) {
          const allowed = new Set(subjList.map(s => s.id));
          const pruned = newForm.selectedSubjects.filter(s => allowed.has(s.id));
          if (pruned.length !== newForm.selectedSubjects.length) {
            setNewForm({ ...newForm, selectedSubjects: pruned });
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { active = false; };
  }, [newForm.selectedStaff, newForm.semester]);

  // Derived selections for Create Form modal (use unique names to avoid collisions)
  const cfSelectedSubjectId = (newForm.selectedSubjects && newForm.selectedSubjects[0]?.id) || '';
  const cfFilteredSubjects = subjects.filter(sub => !newForm.semester || String(sub.semester || '').trim() === String(newForm.semester));
  // Staff list is already filtered by subject via /feedback/meta effect; expose as-is for render
  const cfFilteredStaffBySubject = cfSelectedSubjectId ? staff : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Feedback Form Generation</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Form
        </button>
      </div>

      {/* Existing Forms */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Existing Feedback Forms</h2>
        {loadingForms && (
          <p className="text-gray-500 dark:text-gray-400">Loading forms...</p>
        )}

      {/* Edit Form Modal */}
      {showEditForm && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Edit Feedback Form</h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Form Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
                      placeholder="Enter form title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Semester</label>
                    <select
                      value={editForm.semester || ''}
                      onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select semester</option>
                      {semesters.map(semester => (
                        <option key={semester} value={semester}>{semester}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date *</label>
                    <DatePicker
                      selected={editForm.startDate ? new Date(editForm.startDate) : null}
                      onChange={(date: Date | null) =>
                        setEditForm({ ...editForm, startDate: date ? format(date, 'yyyy-MM-dd') : '' })
                      }
                      dateFormat="yyyy-MM-dd"
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholderText="Select start date"
                      isClearable
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date *</label>
                    <DatePicker
                      selected={editForm.endDate ? new Date(editForm.endDate) : null}
                      onChange={(date: Date | null) =>
                        setEditForm({ ...editForm, endDate: date ? format(date, 'yyyy-MM-dd') : '' })
                      }
                      dateFormat="yyyy-MM-dd"
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholderText="Select end date"
                      minDate={editForm.startDate ? new Date(editForm.startDate) : undefined}
                      isClearable
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
                    rows={3}
                    placeholder="Enter form description"
                  />
                </div>
              </div>

              {/* Question Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Questions *</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4 dark:border-gray-600 dark:bg-gray-800/50">
                  {questions.map((question) => {
                    const selected = editForm.questions?.some(q => q.id === question.id) || false;
                    return (
                      <div key={question.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            if (selected) {
                              setEditForm({ ...editForm, questions: (editForm.questions || []).filter(q => q.id !== question.id) });
                            } else {
                              setEditForm({ ...editForm, questions: ([...(editForm.questions || []), question]) });
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{question.text}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-300">Type: {question.type} | {question.required ? 'Required' : 'Optional'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subject Selection (Dropdown) */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Subject</h3>
                <div className="space-y-2">
                  <select
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={(editForm.selectedSubjects && editForm.selectedSubjects[0]?.id) || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        setEditForm({ ...editForm, selectedSubjects: [] });
                        return;
                      }
                      const subj = subjects.find(s => s.id === id);
                      setEditForm({ ...editForm, selectedSubjects: subj ? [subj] : [] });
                    }}
                  >
                    <option value="">{editForm.semester ? `Select a subject in semester ${editForm.semester}` : 'Select a subject'}</option>
                    {(subjects.filter(sub => !editForm.semester || String(sub.semester || '').trim() === String(editForm.semester))).map(subj => (
                      <option key={subj.id} value={subj.id}>{subj.name}{subj.code ? ` (${subj.code})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Staff Selection (Dropdown) */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Staff</h3>
                <div className="space-y-2">
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={(editForm.selectedStaff && editForm.selectedStaff[0]?.id) || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        setEditForm({ ...editForm, selectedStaff: [] });
                        return;
                      }
                      const st = staff.find(s => s.id === id);
                      setEditForm({ ...editForm, selectedStaff: st ? [st] : [] });
                    }}
                    disabled={!(editForm.selectedSubjects && editForm.selectedSubjects[0]?.id)}
                  >
                    <option value="">{(editForm.selectedSubjects && editForm.selectedSubjects[0]?.id) ? 'Select staff for the selected subject' : 'Select a subject first'}</option>
                    {(() => {
                      const ssid = (editForm.selectedSubjects && editForm.selectedSubjects[0]?.id) || '';
                      const sub = subjects.find(s => s.id === ssid);
                      const list = ssid ? staff.filter(s => (s.subjects || []).some(val => {
                        const v = String(val);
                        return v === String(ssid) || (sub?.code ? v === String(sub.code) : false) || (sub?.name ? v === String(sub.name) : false);
                      })) : staff;
                      return list.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
        {formsError && (
          <p className="text-red-600">{formsError}</p>
        )}
        {!loadingForms && !formsError && forms.length === 0 ? (
          <p className="text-gray-500">No feedback forms created yet.</p>
        ) : !formsError && forms.length > 0 ? (
          <>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="px-2 py-1 rounded bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-700/60 dark:text-gray-200 dark:border-gray-600">
                  Total: {forms.length}
                </span>
                <span className="px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-400/30">
                  Active: {activeCount}
                </span>
                <span className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-400/30">
                  Inactive: {Math.max(0, forms.length - activeCount)}
                </span>
                {showOnlyActive && (
                  <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-400/30">
                    Showing only active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showOnlyActive ? (
                  <button
                    onClick={() => {
                      setShowOnlyActive(false);
                      const params = new URLSearchParams(location.search);
                      params.delete('active');
                      navigate({ search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
                    }}
                    className="text-sm px-3 py-1 border rounded hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Show all
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowOnlyActive(true);
                      const params = new URLSearchParams(location.search);
                      params.set('active', '1');
                      navigate({ search: `?${params.toString()}` }, { replace: true });
                    }}
                    className="text-sm px-3 py-1 border rounded hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Show only active
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-4">
            {displayedForms.map((form) => (
              <div key={form.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{form.title || `${form.selectedSubjects[0]?.name || 'Subject'} - ${form.selectedStaff[0]?.name || 'Staff'}`}</h3>
                    <p className="text-gray-500 text-sm">{`${form.selectedSubjects[0]?.name || 'Subject'} — ${form.selectedStaff[0]?.name || 'Staff'}`}</p>
                    <p className="text-gray-600 mb-2">{form.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Questions: {form.questions.length}</span>
                      <span>Staff: {form.selectedStaff.length}</span>
                      <span>Subjects: {form.selectedSubjects.length}</span>
                      <span>Semester: {form.semester || form.selectedSubjects[0]?.semester || ''}</span>
                      <span>Audience: {form.targetAudience}</span>
                      <span className={`${'px-2 py-1 rounded border'} ${form.isActive
                        ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-400/30'
                        : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-400/30'}`}>
                        {form.isActive ? 'Active' : 'Inactive'} ({String(form.isActive)})
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap mt-2 sm:mt-0">
                    <button
                      onClick={() => handlePreview(form)}
                      className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title="Preview Form"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openEditForm(form)}
                      className="p-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                      title="Edit Form"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => copyFormLink(form.formLink)}
                      className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                      title="Copy Form Link"
                    >
                      <Link size={16} />
                    </button>
                    <button
                      onClick={() => toggleFormStatus(form.id)}
                      disabled={togglingId === form.id}
                      className={`p-2 rounded border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                        form.isActive
                          ? 'bg-orange-100 hover:bg-orange-200 border-orange-200 text-orange-700 hover:text-orange-800 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 dark:border-orange-400/30 dark:text-orange-300'
                          : 'bg-green-100 hover:bg-green-200 border-green-200 text-green-700 hover:text-green-800 dark:bg-green-500/20 dark:hover:bg-green-500/30 dark:border-green-400/30 dark:text-green-300'
                      }`}
                      title={form.isActive ? 'Deactivate' : 'Activate'}
                      aria-busy={togglingId === form.id}
                    >
                      {form.isActive ? <X size={16} /> : <Plus size={16} />}
                    </button>
                    <button
                      onClick={() => deleteForm(form.id)}
                      className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete Form"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        ) : null}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Create New Feedback Form</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Form Title *</label>
                    <input
                      type="text"
                      value={newForm.title || ''}
                      onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Enter form title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Semester *</label>
                    <select
                      value={newForm.semester || ''}
                      onChange={(e) => setNewForm({ ...newForm, semester: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="" disabled>Select semester</option>
                      {semesters.map(semester => (
                        <option key={semester} value={semester}>{semester}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date *</label>
                    <DatePicker
                      selected={startDateObj}
                      onChange={(date: Date | null) =>
                        setNewForm({ ...newForm, startDate: date ? format(date, 'yyyy-MM-dd') : '' })
                      }
                      dateFormat="yyyy-MM-dd"
                      className="w-full p-2 border rounded-lg"
                      placeholderText="Select start date"
                      isClearable
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date *</label>
                    <DatePicker
                      selected={endDateObj}
                      onChange={(date: Date | null) =>
                        setNewForm({ ...newForm, endDate: date ? format(date, 'yyyy-MM-dd') : '' })
                      }
                      dateFormat="yyyy-MM-dd"
                      className="w-full p-2 border rounded-lg"
                      placeholderText="Select end date"
                      minDate={startDateObj || undefined}
                      isClearable
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea
                    value={newForm.description || ''}
                    onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                    placeholder="Enter form description"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Target Audience</label>
                  <select
                    value={newForm.targetAudience || 'students'}
                    onChange={(e) => setNewForm({ ...newForm, targetAudience: e.target.value as 'students' | 'parents' | 'staff' })}
                    className="w-full p-2 border rounded-lg"
                  >
                    {audiences.map(audience => (
                      <option key={audience.value} value={audience.value}>{audience.label}</option>
                    ))}
                  </select>
                </div>
                {/* College Branding (optional) */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">College Branding (optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">College Name</label>
                      <input
                        type="text"
                        value={branding.collegeName}
                        onChange={(e) => setBranding({ ...branding, collegeName: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., ABC Institute of Technology"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">College Logo URL</label>
                      <input
                        type="text"
                        value={branding.collegeLogoUrl}
                        onChange={(e) => setBranding({ ...branding, collegeLogoUrl: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                        placeholder="https://.../logo.png"
                      />
                      <p className="mt-1 text-xs text-gray-500">If provided, these will appear in the public form header.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Questions *</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {loadingLists && <div className="text-sm text-gray-500">Loading questions...</div>}
                  {listsError && <div className="text-sm text-red-600">{listsError}</div>}
                  {!loadingLists && !listsError && questions.length === 0 && (
                    <div className="text-sm text-orange-600">No questions found. Add questions to the Question Bank.</div>
                  )}
                  {questions.map((question) => (
                    <div key={question.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={newForm.questions?.some(q => q.id === question.id) || false}
                        onChange={() => handleQuestionToggle(question)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        {editingQuestion === question.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              defaultValue={question.text}
                              onBlur={(e) => handleEditQuestion(question.id, e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditQuestion(question.id, e.currentTarget.value);
                                }
                              }}
                              className="flex-1 p-1 border rounded"
                              autoFocus
                            />
                            <button
                              onClick={() => setEditingQuestion(null)}
                              className="p-1 text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{question.text}</p>
                              <p className="text-sm text-gray-500">
                                Type: {question.type} | {question.required ? 'Required' : 'Optional'}
                              </p>
                            </div>
                            {newForm.questions?.some(q => q.id === question.id) && (
                              <button
                                onClick={() => setEditingQuestion(question.id)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit Question"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Selection (Dropdown) */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Subject</h3>
                <div className="space-y-2">
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={cfSelectedSubjectId}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        setNewForm({ ...newForm, selectedSubjects: [] });
                        return;
                      }
                      const subj = subjects.find(s => s.id === id);
                      setNewForm({ ...newForm, selectedSubjects: subj ? [subj] : [] });
                    }}
                    disabled={loadingLists || !!listsError || cfFilteredSubjects.length === 0}
                  >
                    <option value="">{newForm.semester ? `Select a subject in semester ${newForm.semester}` : 'Select a semester first'}</option>
                    {cfFilteredSubjects.map(subj => (
                      <option key={subj.id} value={subj.id}>{subj.name}{subj.code ? ` (${subj.code})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Staff Selection (Dropdown) */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Staff</h3>
                <div className="space-y-2">
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={(newForm.selectedStaff && newForm.selectedStaff[0]?.id) || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        setNewForm({ ...newForm, selectedStaff: [] });
                        return;
                      }
                      const st = staff.find(s => s.id === id);
                      setNewForm({ ...newForm, selectedStaff: st ? [st] : [] });
                    }}
                    disabled={loadingLists || !!listsError || !cfSelectedSubjectId}
                  >
                    <option value="">{cfSelectedSubjectId ? 'Select staff for the selected subject' : 'Select a subject first'}</option>
                    {cfFilteredStaffBySubject.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remove old checkbox lists in favor of dropdowns above */}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateForm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                <Save className="w-4 h-4" />
                Create Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Form Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-bold">{previewForm.title}</h3>
                <p className="text-gray-600">{previewForm.description}</p>
                <div className="mt-2 text-sm text-gray-500 flex flex-wrap gap-2">
                  <span>Semester: {previewForm.semester}</span>
                  <span>|</span>
                  <span>Audience: {previewForm.targetAudience}</span>
                  <span>|</span>
                  <span>Start: {previewForm.startDate}</span>
                  <span>|</span>
                  <span>End: {previewForm.endDate}</span>
                </div>
              </div>

              {/* Personal Information Fields */}
              <div className="space-y-4">
                <h4 className="font-semibold">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input type="text" className="w-full p-2 border rounded-lg" placeholder="Enter your name" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input type="email" className="w-full p-2 border rounded-lg" placeholder="Enter your email" disabled />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input type="tel" className="w-full p-2 border rounded-lg" placeholder="Enter your phone number" disabled />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <h4 className="font-semibold">Feedback Questions</h4>
                {previewForm.questions.map((question, index) => (
                  <div key={question.id} className="space-y-2">
                    <label className="block text-sm font-medium">
                      {index + 1}. {question.text}
                      {question.required && <span className="text-red-500">*</span>}
                    </label>
                    {question.type === 'multiple-choice' && (
                      <div className="space-y-1">
                        {question.options?.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center gap-2">
                            <input type="radio" name={`question-${question.id}`} disabled />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {question.type === 'text' && (
                      <textarea className="w-full p-2 border rounded-lg" rows={3} placeholder="Enter your response" disabled />
                    )}
                    {question.type === 'rating' && (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <label key={rating} className="flex items-center gap-1">
                            <input type="radio" name={`question-${question.id}`} disabled />
                            <span>{rating}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500">
                  Form Link: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{previewForm.formLink}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Form"
        message="Are you sure you want to delete this feedback form? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => { void confirmDelete(); }}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default FeedbackGeneration;
