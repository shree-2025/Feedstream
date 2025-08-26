import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const FeedbackForm: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [feedbackData, setFeedbackData] = useState<Record<number, string>>({});
  const [formDetails, setFormDetails] = useState<any>(null);
  const [collegeInfo, setCollegeInfo] = useState<{ name?: string; logo?: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    // If already submitted, redirect to Thank You
    const submittedKey = slug ? `feedback_submitted_${slug}` : '';
    if (submittedKey && localStorage.getItem(submittedKey) === '1') {
      navigate(`/feedback/${encodeURIComponent(slug || '')}/thank-you`, { replace: true });
      return;
    }
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (!slug) {
          throw new Error('Invalid link');
        }
        const formRes = await axios.get(`/api/feedback-forms/${encodeURIComponent(slug)}`);
        const form = formRes.data;
        const [staffRes, subjRes, quesRes] = await Promise.all([
          axios.get('/api/staff', { params: { page: 1, limit: 1000 } }),
          axios.get('/api/subjects', { params: { page: 1, limit: 1000 } }),
          axios.get('/api/questions', { params: { page: 1, limit: 1000 } }),
        ]);
        if (!mounted) return;
        const teacher = (staffRes.data?.items || []).find((s: any) => s.id === form.teacherId);
        const subject = (subjRes.data?.items || []).find((s: any) => s.id === form.subjectId);
        const allQ = (quesRes.data?.items || []).map((q: any) => ({ id: q.id, text: q.text, type: q.type, options: q.options }));
        const questions = allQ.filter((q: any) => (form.questionIds || []).includes(q.id));
        setFormDetails({
          title: form.title,
          description: form.description,
          teacher,
          subject,
          questions,
          startDate: form.startDate,
          endDate: form.endDate,
        });
        // Read optional college info from query string
        try {
          const usp = new URLSearchParams(window.location.search);
          const name = usp.get('collegeName') || undefined;
          const logo = usp.get('collegeLogo') || undefined;
          setCollegeInfo({ name, logo });
        } catch {}
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || 'Failed to load form');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [slug]);

  const handleInputChange = (questionId: number, value: string) => {
    setFeedbackData({ ...feedbackData, [questionId]: value });
  };

  const isWithinWindow = () => {
    if (!formDetails?.startDate || !formDetails?.endDate) return true;
    const today = new Date();
    const s = new Date(formDetails.startDate);
    const e = new Date(formDetails.endDate);
    return today >= s && today <= e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWithinWindow()) {
      toast.error('This form is not currently accepting responses.');
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Please fill your Name, Email and Phone.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = { answers: { name: name.trim(), email: email.trim(), phone: phone.trim(), ...feedbackData } };
      await axios.post(`/api/feedback-forms/${encodeURIComponent(slug || '')}/responses`, payload);
      // Redirect to thank-you screen
      try {
        if (slug) localStorage.setItem(`feedback_submitted_${slug}`, '1');
      } catch {}
      navigate(`/feedback/${encodeURIComponent(slug || '')}/thank-you`, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center p-6">Loading form…</div>;
  if (error) return <div className="text-center p-6 text-red-600">{error}</div>;
  if (!formDetails || !formDetails.teacher || !formDetails.subject) return <div className="text-center p-6">Invalid or expired link.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        {/* College Header (optional) */}
        {(collegeInfo.logo || collegeInfo.name) && (
          <div className="mb-4 flex items-center gap-3">
            {collegeInfo.logo && (
              <img src={collegeInfo.logo} alt={collegeInfo.name || 'College'} className="h-10 w-10 object-contain" />
            )}
            {collegeInfo.name && (
              <div className="text-sm text-gray-700 dark:text-gray-300">{collegeInfo.name}</div>
            )}
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{formDetails.title || 'Feedback Form'}</h1>
          {formDetails.description && (
            <p className="text-gray-600 dark:text-gray-300 mt-1">{formDetails.description}</p>
          )}
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            For <strong>{formDetails.teacher.name}</strong> on the subject of <strong>{formDetails.subject.name}</strong>
            <br/>
            <span className="text-xs">Available: {formDetails.startDate} to {formDetails.endDate}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                pattern="[0-9]{10,}"
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          </div>

          {formDetails.questions.map((q: any) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{q.text}</label>
              {q.type === 'multiple-choice' && Array.isArray(q.options) ? (
                <div className="space-y-2">
                  {q.options.map((opt: any, idx: number) => (
                    <label key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        className="text-blue-600"
                        required
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              ) : q.type === 'rating' ? (
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map(n => (
                    <label key={n} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={String(n)}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        className="text-blue-600"
                        required
                      />
                      <span>{n}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                  placeholder="Your answer"
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  required
                />
              )}
            </div>
          ))}

          {!isWithinWindow() && (
            <div className="text-center text-sm text-red-600">This form is closed. It was available from {formDetails.startDate} to {formDetails.endDate}.</div>
          )}
          
          <div className="text-center pt-4">
            <button type="submit" disabled={submitting || !isWithinWindow()} className="px-8 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
