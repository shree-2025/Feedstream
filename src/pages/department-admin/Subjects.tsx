import React, { useState } from 'react';
import { Plus, Search, Eye, FileText, Edit, Trash2, Download, X, Upload } from 'lucide-react';

interface Subject {
  id: number;
  name: string;
  code: string;
  department: string;
  credits: number;
  description: string;
  semester: string;
  type?: string;
  instructor?: string;
  duration?: string;
  prerequisites?: string;
  objectives?: string;
  createdAt: string;
}

const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: 1,
      name: 'Computer Science Fundamentals',
      code: 'CS101',
      department: 'Computer Science',
      credits: 3,
      description: 'Introduction to Computer Science fundamentals including programming concepts, data structures, and algorithms',
      semester: '1',
      type: 'core',
      instructor: 'Dr. John Smith',
      duration: '16 weeks',
      prerequisites: 'None',
      objectives: 'Understand basic programming concepts, Learn problem-solving techniques, Master fundamental data structures',
      createdAt: '2024-01-15',
    },
    {
      id: 2,
      name: 'Data Structures and Algorithms',
      code: 'CS201',
      department: 'Computer Science',
      credits: 4,
      description: 'Advanced data structures and algorithms including trees, graphs, sorting, and searching techniques',
      semester: '3',
      type: 'core',
      instructor: 'Prof. Jane Wilson',
      duration: '16 weeks',
      prerequisites: 'CS101 - Computer Science Fundamentals',
      objectives: 'Master advanced data structures, Implement efficient algorithms, Analyze time and space complexity',
      createdAt: '2024-02-10',
    },
    {
      id: 3,
      name: 'Database Management Systems',
      code: 'CS301',
      department: 'Computer Science',
      credits: 3,
      description: 'Comprehensive study of database design, implementation, and management including SQL, normalization, and transaction processing',
      semester: '5',
      type: 'core',
      instructor: 'Dr. Michael Brown',
      duration: '16 weeks',
      prerequisites: 'CS201 - Data Structures and Algorithms',
      objectives: 'Design efficient database schemas, Master SQL queries, Understand transaction management',
      createdAt: '2024-03-05',
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    department: '',
    credits: 0,
    description: '',
    semester: '',
    type: 'core',
    instructor: '',
    duration: '',
    prerequisites: '',
    objectives: '',
  });

  const handleAddSubject = () => {
    setEditingSubject(null);
    setNewSubject({
      name: '',
      code: '',
      department: '',
      credits: 0,
      description: '',
      semester: '',
      type: 'core',
      instructor: '',
      duration: '',
      prerequisites: '',
      objectives: '',
    });
    setIsModalOpen(true);
  };

  const handleViewSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsViewModalOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setNewSubject({
      name: subject.name,
      code: subject.code,
      department: subject.department,
      credits: subject.credits,
      description: subject.description,
      semester: subject.semester,
      type: subject.type || 'core',
      instructor: subject.instructor || '',
      duration: subject.duration || '',
      prerequisites: subject.prerequisites || '',
      objectives: subject.objectives || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveSubject = () => {
    if (!newSubject.name || !newSubject.code) return;

    const subjectData: Subject = {
      id: editingSubject ? editingSubject.id : Date.now(),
      ...newSubject,
      createdAt: editingSubject ? editingSubject.createdAt : new Date().toISOString().split('T')[0]
    };

    if (editingSubject) {
      setSubjects(subjects.map(s => s.id === editingSubject.id ? subjectData : s));
    } else {
      setSubjects([...subjects, subjectData]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteSubject = (id: number) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const newSubjects: Subject[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const [name, code, department, credits, description, semester, type, instructor, duration, prerequisites, objectives] = lines[i].split(',');
          if (name && code) {
            newSubjects.push({
              id: Date.now() + i,
              name: name.trim(),
              code: code.trim(),
              department: department?.trim() || '',
              credits: parseInt(credits?.trim()) || 0,
              description: description?.trim() || '',
              semester: semester?.trim() || '',
              type: type?.trim() || 'core',
              instructor: instructor?.trim() || '',
              duration: duration?.trim() || '',
              prerequisites: prerequisites?.trim() || '',
              objectives: objectives?.trim() || '',
              createdAt: new Date().toISOString().split('T')[0]
            });
          }
        }
        
        setSubjects([...subjects, ...newSubjects]);
        setIsBulkUploadOpen(false);
      };
      reader.readAsText(file);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Name,Code,Department,Credits,Description,Semester,Type,Instructor,Duration,Prerequisites,Objectives\n" +
      "Data Structures,CS201,Computer Science,3,Advanced programming concepts,Fall 2024,core,Dr. Jane Doe,16 weeks,None,Understand data structures, Learn problem-solving techniques, Master fundamental algorithms\n" +
      "Linear Algebra,MATH201,Mathematics,4,Vector spaces and matrices,Spring 2024,core,Dr. John Smith,16 weeks,None,Understand vector spaces, Learn matrix operations, Master linear transformations";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subjects_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            <Upload size={16} />
            Bulk Upload
          </button>
          <button
            onClick={handleAddSubject}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Subject
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search subjects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredSubjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{subject.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{subject.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{subject.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{subject.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{subject.credits}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{subject.semester}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewSubject(subject)}
                        className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                        title="Generate Report"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handleEditSubject(subject)}
                        className="p-2 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
                        title="Edit Subject"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Delete Subject"
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

      {/* Add/Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject Name *</label>
                  <input
                    type="text"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    placeholder="Enter subject name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject Code *</label>
                  <input
                    type="text"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    placeholder="e.g., CS101"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department *</label>
                  <select
                    value={newSubject.department}
                    onChange={(e) => setNewSubject({...newSubject, department: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Credits *</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newSubject.credits}
                    onChange={(e) => setNewSubject({...newSubject, credits: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    placeholder="Enter credits (1-6)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester *</label>
                  <select
                    value={newSubject.semester}
                    onChange={(e) => setNewSubject({...newSubject, semester: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject Type</label>
                  <select
                    value={newSubject.type || 'core'}
                    onChange={(e) => setNewSubject({...newSubject, type: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="core">Core Subject</option>
                    <option value="elective">Elective</option>
                    <option value="lab">Laboratory</option>
                    <option value="project">Project</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  rows={3}
                  placeholder="Enter subject description (optional)"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSubject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 order-1 sm:order-2"
                >
                  {editingSubject ? 'Update' : 'Add'} Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Bulk Upload Subjects</h2>
              <button
                onClick={() => setIsBulkUploadOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">CSV Format Requirements</h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                  Your CSV file should contain the following columns:
                </p>
                <code className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded block">
                  Name, Code, Department, Credits, Semester, Type, Description
                </code>
              </div>
              
              <div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Download size={16} />
                  Download CSV Template
                </button>
              </div>
              
              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upload CSV File *</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkUpload}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:file:hover:bg-blue-800"
                      required
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Select a CSV file or drag and drop it here
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => setIsBulkUploadOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 order-1 sm:order-2"
                  >
                    Upload & Process
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Subject Details Modal */}
      {isViewModalOpen && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Subject Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Header with Subject Info */}
              <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-gray-200 dark:border-gray-600">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                    {selectedSubject.code}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSubject.name}</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{selectedSubject.code}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{selectedSubject.department}</p>
                  <div className="flex gap-3 mt-3">
                    <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      {selectedSubject.credits} Credits
                    </span>
                    <span className="px-3 py-1 text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                      Semester {selectedSubject.semester}
                    </span>
                    <span className="px-3 py-1 text-sm font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full capitalize">
                      {selectedSubject.type || 'Core'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Instructor</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedSubject.instructor || 'Not assigned'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedSubject.duration || 'Not specified'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject ID</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">SUB{selectedSubject.id.toString().padStart(4, '0')}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {new Date(selectedSubject.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                    {selectedSubject.description || 'No description available'}
                  </p>
                </div>
              </div>

              {/* Prerequisites */}
              {selectedSubject.prerequisites && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Prerequisites</h4>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {selectedSubject.prerequisites}
                    </p>
                  </div>
                </div>
              )}

              {/* Learning Objectives */}
              {selectedSubject.objectives && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Learning Objectives</h4>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                    <div className="space-y-2">
                      {selectedSubject.objectives.split(',').map((objective, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-green-800 dark:text-green-200">{objective.trim()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
                    handleEditSubject(selectedSubject);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  <Edit size={16} />
                  Edit Subject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
