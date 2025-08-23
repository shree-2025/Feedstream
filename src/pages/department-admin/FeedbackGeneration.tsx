import React, { useState } from 'react';
import { Plus, Eye, Link, Edit, Trash2, Save, X } from 'lucide-react';

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
  email: string;
  department: string;
  subject: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: string;
}

interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  selectedStaff: Staff[];
  selectedSubjects: Subject[];
  semester: string;
  targetAudience: 'students' | 'parents' | 'staff';
  isActive: boolean;
  createdAt: string;
  formLink: string;
}

const FeedbackGeneration: React.FC = () => {
  const [questions] = useState<Question[]>([
    { id: '1', text: 'How would you rate the overall teaching quality?', type: 'rating', required: true },
    { id: '2', text: 'What did you like most about this course?', type: 'text', required: false },
    { id: '3', text: 'How clear were the course objectives?', type: 'multiple-choice', options: ['Very Clear', 'Clear', 'Somewhat Clear', 'Unclear'], required: true },
  ]);

  const [staff] = useState<Staff[]>([
    { id: '1', name: 'Dr. John Smith', email: 'john.smith@university.edu', department: 'Computer Science', subject: 'Data Structures' },
    { id: '2', name: 'Prof. Sarah Johnson', email: 'sarah.johnson@university.edu', department: 'Computer Science', subject: 'Algorithms' },
  ]);

  const [subjects] = useState<Subject[]>([
    { id: '1', name: 'Data Structures', code: 'CS201', department: 'Computer Science', semester: 'Fall 2024' },
    { id: '2', name: 'Algorithms', code: 'CS301', department: 'Computer Science', semester: 'Fall 2024' },
  ]);

  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewForm, setPreviewForm] = useState<FeedbackForm | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  const [newForm, setNewForm] = useState<Partial<FeedbackForm>>({
    title: '',
    description: '',
    questions: [],
    selectedStaff: [],
    selectedSubjects: [],
    semester: 'Fall 2024',
    targetAudience: 'students',
  });

  const semesters = ['Fall 2024', 'Spring 2025', 'Summer 2025'];
  const audiences = [
    { value: 'students', label: 'Students' },
    { value: 'parents', label: 'Parents' },
    { value: 'staff', label: 'Staff' },
  ];

  const handleCreateForm = () => {
    if (!newForm.title || !newForm.description || newForm.questions?.length === 0) {
      alert('Please fill in all required fields and select at least one question.');
      return;
    }

    const form: FeedbackForm = {
      id: Date.now().toString(),
      title: newForm.title!,
      description: newForm.description!,
      questions: newForm.questions!,
      selectedStaff: newForm.selectedStaff!,
      selectedSubjects: newForm.selectedSubjects!,
      semester: newForm.semester!,
      targetAudience: newForm.targetAudience!,
      isActive: true,
      createdAt: new Date().toISOString(),
      formLink: `https://feedback.university.edu/form/${Date.now()}`,
    };

    setForms([...forms, form]);
    setNewForm({
      title: '',
      description: '',
      questions: [],
      selectedStaff: [],
      selectedSubjects: [],
      semester: 'Fall 2024',
      targetAudience: 'students',
    });
    setShowCreateForm(false);
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

  const handleStaffToggle = (staffMember: Staff) => {
    const isSelected = newForm.selectedStaff?.some(s => s.id === staffMember.id);
    if (isSelected) {
      setNewForm({
        ...newForm,
        selectedStaff: newForm.selectedStaff?.filter(s => s.id !== staffMember.id),
      });
    } else {
      setNewForm({
        ...newForm,
        selectedStaff: [...(newForm.selectedStaff || []), staffMember],
      });
    }
  };

  const handleSubjectToggle = (subject: Subject) => {
    const isSelected = newForm.selectedSubjects?.some(s => s.id === subject.id);
    if (isSelected) {
      setNewForm({
        ...newForm,
        selectedSubjects: newForm.selectedSubjects?.filter(s => s.id !== subject.id),
      });
    } else {
      setNewForm({
        ...newForm,
        selectedSubjects: [...(newForm.selectedSubjects || []), subject],
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

  const copyFormLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Form link copied to clipboard!');
  };

  const toggleFormStatus = (formId: string) => {
    setForms(forms.map(form =>
      form.id === formId ? { ...form, isActive: !form.isActive } : form
    ));
  };

  const deleteForm = (formId: string) => {
    if (confirm('Are you sure you want to delete this feedback form?')) {
      setForms(forms.filter(form => form.id !== formId));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Feedback Form Generation</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Form
        </button>
      </div>

      {/* Existing Forms */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Existing Feedback Forms</h2>
        {forms.length === 0 ? (
          <p className="text-gray-500">No feedback forms created yet.</p>
        ) : (
          <div className="space-y-4">
            {forms.map((form) => (
              <div key={form.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{form.title}</h3>
                    <p className="text-gray-600 mb-2">{form.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Questions: {form.questions.length}</span>
                      <span>Staff: {form.selectedStaff.length}</span>
                      <span>Subjects: {form.selectedSubjects.length}</span>
                      <span>Semester: {form.semester}</span>
                      <span>Audience: {form.targetAudience}</span>
                      <span className={`px-2 py-1 rounded ${form.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(form)}
                      className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title="Preview Form"
                    >
                      <Eye size={16} />
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
                      className={`p-2 rounded ${form.isActive ? 'text-orange-600 hover:text-orange-900 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-green-600 hover:text-green-900 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                      title={form.isActive ? 'Deactivate' : 'Activate'}
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
        )}
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
                    <label className="block text-sm font-medium mb-1">Semester</label>
                    <select
                      value={newForm.semester || 'Fall 2024'}
                      onChange={(e) => setNewForm({ ...newForm, semester: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      {semesters.map(semester => (
                        <option key={semester} value={semester}>{semester}</option>
                      ))}
                    </select>
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
              </div>

              {/* Question Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Questions *</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
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

              {/* Staff Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Staff (Optional)</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-4">
                  {staff.map((staffMember) => (
                    <div key={staffMember.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={newForm.selectedStaff?.some(s => s.id === staffMember.id) || false}
                        onChange={() => handleStaffToggle(staffMember)}
                      />
                      <div>
                        <p className="font-medium">{staffMember.name}</p>
                        <p className="text-sm text-gray-500">{staffMember.subject} - {staffMember.department}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Subjects (Optional)</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-4">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={newForm.selectedSubjects?.some(s => s.id === subject.id) || false}
                        onChange={() => handleSubjectToggle(subject)}
                      />
                      <div>
                        <p className="font-medium">{subject.name} ({subject.code})</p>
                        <p className="text-sm text-gray-500">{subject.department} - {subject.semester}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                <div className="mt-2 text-sm text-gray-500">
                  <span>Semester: {previewForm.semester} | </span>
                  <span>Audience: {previewForm.targetAudience}</span>
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
    </div>
  );
};

export default FeedbackGeneration;
