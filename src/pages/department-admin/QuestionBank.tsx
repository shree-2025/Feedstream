import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, Search, Upload, Download, X, Eye, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
// Using a simple confirm dialog since the component is not found
const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel 
}: { 
  isOpen: boolean; 
  title: string; 
  message: string; 
  confirmText?: string; 
  cancelText?: string; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'text' | 'rating';
  options: string[];
  category: string;
  description: string;
  isRequired: boolean;
  createdAt: string;
}


const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newQuestion, setNewQuestion] = useState<Omit<Question, 'id' | 'createdAt'>>({
    text: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    category: '',
    description: '',
    isRequired: false,
  } as const);

  const predefinedTemplates = [
    {
      name: 'Yes/No',
      type: 'multiple-choice' as const,
      options: ['Yes', 'No']
    },
    {
      name: '5-Point Scale (Excellent to Poor)',
      type: 'multiple-choice' as const,
      options: ['Excellent', 'Very Good', 'Good', 'Average', 'Poor']
    },
    {
      name: 'Agreement Scale',
      type: 'multiple-choice' as const,
      options: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree']
    },
    {
      name: 'Satisfaction Scale',
      type: 'multiple-choice' as const,
      options: ['Outstanding', 'Very Satisfactory', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory']
    },
    {
      name: 'Frequency Scale',
      type: 'multiple-choice' as const,
      options: ['Always', 'Often', 'Sometimes', 'Rarely', 'Never']
    }
  ];

  const applyTemplate = (template: typeof predefinedTemplates[number]) => {
    setNewQuestion({
      text: '',
      type: template.type,
      options: [...template.options],
      category: newQuestion.category,
      description: '',
      isRequired: false
    });
    setIsTemplateModalOpen(false);
    setIsModalOpen(true);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Confirm dialog state (deletions)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Fetch list from backend (server-side pagination + search)
  const fetchQuestions = async (opts?: { page?: number; limit?: number; search?: string }) => {
    setLoadingList(true);
    try {
      const page = opts?.page ?? currentPage;
      const limit = opts?.limit ?? pageSize;
      const search = opts?.search ?? searchTerm;
      const { data } = await api.get('/questions', { params: { page, limit, search } });
      setQuestions(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      toast.error('Failed to fetch questions');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setNewQuestion({
      text: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      category: '',
      description: '',
      isRequired: false,
    });
    setIsModalOpen(true);
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setIsViewModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setNewQuestion({
      text: question.text,
      type: question.type,
      options: question.options || ['', '', '', ''],
      category: question.category,
      description: question.description || '',
      isRequired: question.isRequired || false,
    });
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!newQuestion.text || !newQuestion.category) return;

    const questionData: Question = {
      id: editingQuestion ? editingQuestion.id : Date.now(),
      text: newQuestion.text,
      type: newQuestion.type,
      category: newQuestion.category,
      description: newQuestion.description,
      isRequired: newQuestion.isRequired,
      createdAt: editingQuestion ? editingQuestion.createdAt : new Date().toISOString().split('T')[0],
      options: newQuestion.type === 'multiple-choice' 
        ? newQuestion.options.filter(opt => opt.trim() !== '')
        : []
    };

    try {
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion.id}`, questionData);
        toast.success('Question updated');
      } else {
        await api.post('/questions', questionData);
        toast.success('Question added');
        // Jump to last page based on new total
        const totalAfterAdd = total + 1;
        const lastPage = Math.max(1, Math.ceil(totalAfterAdd / pageSize));
        setCurrentPage(lastPage);
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save question');
    }
  };

  const requestDeleteQuestion = (id: number) => {
    setConfirmMessage('Are you sure you want to delete this question? This action cannot be undone.');
    setConfirmAction(() => async () => {
      try {
        await api.delete(`/questions/${id}`);
        if (questions.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchQuestions();
        }
        toast.success('Question deleted');
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to delete question');
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  const parseCsvLine = (raw: string) => {
    const cols: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < raw.length; c++) {
      const ch = raw[c];
      if (ch === '"') {
        if (inQuotes && raw[c + 1] === '"') { cur += '"'; c++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        cols.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    return cols;
  };


  // When search changes, go to page 1 and fetch
  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1);
      fetchQuestions({ page: 1, limit: pageSize, search: searchTerm });
    }, 300);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStartIndex = (currentPage - 1) * pageSize;
  const currentItems = questions; // already paginated by server

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 md:gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Question Bank</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 whitespace-nowrap"
          >
            <Upload size={16} />
            Bulk Upload
          </button>
          <div className="relative">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 whitespace-nowrap w-full"
            >
              <FileText size={16} />
              Add from Template
            </button>
          </div>
          <button
            onClick={handleAddQuestion}
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap"
          >
            <Plus size={16} />
            Add Question
          </button>
        </div>
      </div>

      {/* Template Selection Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select a Template</h2>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predefinedTemplates.map((template, index) => (
                <div 
                  key={index}
                  onClick={() => applyTemplate(template)}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">{template.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.options.map((option, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirm Deletion"
        message={confirmMessage}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => confirmAction && confirmAction()}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Questions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {loadingList && (
                <tr>
                  <td className="px-3 md:px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={5}>Loading...</td>
                </tr>
              )}
              {!loadingList && currentItems.length === 0 && (
                <tr>
                  <td className="px-3 md:px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={5}>No questions found</td>
                </tr>
              )}
              {!loadingList && currentItems.map((question) => (
                <tr key={question.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 md:px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white break-words max-w-xs md:max-w-md">{question.text}</div>
                    {question.options && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Options: {question.options.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-3 md:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="capitalize">{question.type.replace('-', ' ')}</span>
                  </td>
                  <td className="px-3 md:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {question.category}
                  </td>
                  <td className="px-3 md:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {question.createdAt}
                  </td>
                  <td className="px-3 md:px-6 py-4 text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewQuestion(question)}
                        className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="p-2 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
                        title="Edit Question"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => requestDeleteQuestion(question.id)}
                        className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination footer (outside card) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-1 md:px-0 mt-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {total === 0 ? 0 : pageStartIndex + 1}-{Math.min(pageStartIndex + pageSize, total)} of {total}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            {(() => {
              const btns = [] as React.ReactNode[];
              const maxButtons = 5;
              let start = Math.max(1, currentPage - 2);
              let end = Math.min(totalPages, start + maxButtons - 1);
              if (end - start + 1 < maxButtons) {
                start = Math.max(1, end - maxButtons + 1);
              }
              for (let p = start; p <= end; p++) {
                btns.push(
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1 rounded border text-sm ${
                      p === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                );
              }
              return btns;
            })()}
            <button
              className="p-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl w-full max-w-lg md:max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Text
                </label>
                <textarea
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                  className="w-full p-2 md:p-3 text-sm md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  placeholder="Enter your question here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Type
                </label>
                <select
                  value={newQuestion.type}
                  onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value as any})}
                  className="w-full p-2 md:p-3 text-sm md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="text">Text Response</option>
                  <option value="rating">Rating Scale</option>
                </select>
              </div>

              {newQuestion.type === 'multiple-choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Options
                  </label>
                  {newQuestion.options?.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(newQuestion.options || [])];
                        newOptions[index] = e.target.value;
                        setNewQuestion({...newQuestion, options: newOptions});
                      }}
                      className="w-full p-2 text-sm md:text-base border border-gray-300 rounded-md mb-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder={`Option ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                  className="w-full p-2 text-sm md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., Teaching Quality, Course Content"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 order-1 sm:order-2"
              >
                {editingQuestion ? 'Update' : 'Add'} Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Bulk Upload Questions</h2>
              <button
                onClick={() => setIsBulkUploadOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Upload a CSV file with your questions. Required headers: <code>text,type,options,category,description,isRequired</code>.
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { data } = await api.get('/questions/template.csv', { responseType: 'blob' });
                    const blob = new Blob([data], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'questions-template.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err: any) {
                    toast.error('Failed to download template');
                  }
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
              >
                <Download size={16} />
                Download CSV Template
              </button>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!bulkFile) { toast.error('Please choose a CSV file'); return; }
                  setBulkLoading(true);
                  try {
                    const csv = await bulkFile.text();
                    const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
                    if (lines.length <= 1) throw new Error('CSV has no data rows');
                    const header = parseCsvLine(lines[0]).map(h => h.trim().replace(/^\ufeff/, '').toLowerCase());
                    const idx = (name: string) => header.indexOf(name);
                    const iText = idx('text');
                    const iType = idx('type');
                    const iOptions = idx('options');
                    const iCategory = idx('category');
                    const iDescription = idx('description');
                    const iIsReq = idx('isrequired');
                    const items: any[] = [];
                    for (let r = 1; r < lines.length; r++) {
                      const cols = parseCsvLine(lines[r]);
                      const get = (i: number) => (i >= 0 && i < cols.length ? cols[i].trim() : '');
                      const text = get(iText);
                      const type = get(iType);
                      const category = get(iCategory);
                      if (!text || !type || !category) continue;
                      let options: string[] | undefined = undefined;
                      const optRaw = get(iOptions);
                      if (optRaw) {
                        try {
                          const parsed = JSON.parse(optRaw);
                          if (Array.isArray(parsed)) options = parsed;
                        } catch {
                          options = optRaw.split(';').map(s => s.trim()).filter(Boolean);
                        }
                      }
                      const description = get(iDescription) || '';
                      const isRequired = /^true$/i.test(get(iIsReq));
                      items.push({ text, type, options, category, description, isRequired });
                    }
                    if (items.length === 0) throw new Error('No valid rows parsed');
                    const formData = new FormData();
                    formData.append('items', JSON.stringify(items));
                    await api.post('/questions/bulk', formData);
                    toast.success(`Uploaded ${items.length} question(s)`);
                    setBulkFile(null);
                    setIsBulkUploadOpen(false);
                    fetchQuestions();
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || err?.message || 'Bulk upload failed');
                  } finally {
                    setBulkLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                    className="w-full p-2 md:p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBulkUploadOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bulkLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60"
                  >
                    {bulkLoading ? 'Uploading...' : 'Upload & Process'}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsBulkUploadOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Question Details Modal */}
      {isViewModalOpen && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Question Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Question Header */}
              <div className="pb-6 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                      Q{selectedQuestion.id}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedQuestion.text}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full capitalize">
                        {selectedQuestion.type.replace('-', ' ')}
                      </span>
                      <span className="px-3 py-1 text-sm font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                        {selectedQuestion.category}
                      </span>
                      {selectedQuestion.isRequired && (
                        <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Question Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Question Type</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1 capitalize">{selectedQuestion.type.replace('-', ' ')}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedQuestion.category}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Question ID</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">QUE{selectedQuestion.id.toString().padStart(4, '0')}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {new Date(selectedQuestion.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedQuestion.description && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                      {selectedQuestion.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Options for Multiple Choice */}
              {selectedQuestion.type === 'multiple-choice' && selectedQuestion.options && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Answer Options</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <div className="space-y-2">
                      {selectedQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {String.fromCharCode(65 + index)}
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-200">{option}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Question Type Info */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Response Type</h4>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {selectedQuestion.type === 'rating' && 'Respondents will provide a numerical rating (typically 1-5 scale)'}
                    {selectedQuestion.type === 'text' && 'Respondents will provide open-ended text responses'}
                    {selectedQuestion.type === 'multiple-choice' && 'Respondents will select one option from the provided choices'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 order-2 sm:order-1"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEditQuestion(selectedQuestion);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  <Edit size={16} />
                  Edit Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
