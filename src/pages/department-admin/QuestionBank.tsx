import React, { useState } from 'react';
import { Edit, Trash2, Plus, Search, Upload, Download, X, Eye } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'text' | 'rating';
  options?: string[];
  category: string;
  description?: string;
  isRequired?: boolean;
  createdAt: string;
}

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      text: 'How would you rate the overall quality of the course?',
      type: 'rating',
      category: 'Course Quality',
      description: 'This question evaluates the overall satisfaction with course content, delivery, and learning outcomes',
      isRequired: true,
      createdAt: '2024-01-15'
    },
    {
      id: 3,
      text: 'Which teaching method was most effective?',
      type: 'multiple-choice',
      options: ['Lectures', 'Practical Sessions', 'Group Discussions', 'Online Resources'],
      category: 'Teaching Methods',
      description: 'Multiple choice question to identify preferred teaching methodologies',
      isRequired: true,
      createdAt: '2024-01-17'
    },
    {
      id: 2,
      text: 'What did you like most about this course?',
      type: 'text',
      category: 'Course Content',
      description: 'Open-ended question to gather positive feedback about specific course aspects',
      isRequired: false,
      createdAt: '2024-01-16'
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'multiple-choice' as 'multiple-choice' | 'text' | 'rating',
    options: ['', '', '', ''],
    category: '',
    description: '',
    isRequired: false,
  });

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

  const handleSaveQuestion = () => {
    if (!newQuestion.text || !newQuestion.category) return;

    const questionData: Question = {
      id: editingQuestion ? editingQuestion.id : Date.now(),
      text: newQuestion.text,
      type: newQuestion.type,
      category: newQuestion.category,
      description: newQuestion.description,
      isRequired: newQuestion.isRequired,
      createdAt: editingQuestion ? editingQuestion.createdAt : new Date().toISOString().split('T')[0],
      ...(newQuestion.type === 'multiple-choice' && {
        options: newQuestion.options.filter(opt => opt.trim() !== '')
      })
    };

    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? questionData : q));
    } else {
      setQuestions([...questions, questionData]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteQuestion = (id: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const newQuestions: Question[] = [];
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const [text, type, category, description, isRequired, ...options] = lines[i].split(',');
          if (text && type && category) {
            newQuestions.push({
              id: Date.now() + i,
              text: text.trim(),
              type: type.trim() as 'multiple-choice' | 'text' | 'rating',
              category: category.trim(),
              description: description.trim(),
              isRequired: isRequired.trim() === 'true',
              createdAt: new Date().toISOString().split('T')[0],
              ...(type.trim() === 'multiple-choice' && {
                options: options.map(opt => opt.trim()).filter(opt => opt !== '')
              })
            });
          }
        }
        
        setQuestions([...questions, ...newQuestions]);
        setIsBulkUploadOpen(false);
      };
      reader.readAsText(file);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Question Text,Type,Category,Description,Is Required,Option 1,Option 2,Option 3,Option 4\n" +
      "How would you rate the overall quality of the course?,rating,Course Quality,This question evaluates the overall satisfaction with course content, delivery, and learning outcomes,true\n" +
      "Which teaching method was most effective?,multiple-choice,Teaching Methods,Multiple choice question to identify preferred teaching methodologies,true,Lectures,Practical Sessions,Group Discussions,Online Resources";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_bank_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredQuestions = questions.filter(question =>
    question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <button
            onClick={handleAddQuestion}
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap"
          >
            <Plus size={16} />
            Add Question
          </button>
        </div>
      </div>

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full">
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
              {filteredQuestions.map((question) => (
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
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
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
                  {newQuestion.options.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
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
                Upload a CSV file with your questions. Download the template below to see the required format.
              </div>
              
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
              >
                <Download size={16} />
                Download CSV Template
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBulkUpload}
                  className="w-full p-2 md:p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
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
