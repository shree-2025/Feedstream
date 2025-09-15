import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, FileText, Edit, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';

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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  // Order is now handled by the backend
  const [loading, setLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [semesterFilter, setSemesterFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    credits: 0,
    description: '',
    semester: '',
    type: 'core',
    instructor: '',
    duration: '',
    prerequisites: '',
    objectives: '',
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/subjects', {
        params: { 
          page, 
          limit, 
          search: searchTerm, 
          department: departmentFilter, 
          semester: semesterFilter, 
          type: typeFilter 
        }
      });
      setSubjects(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, departmentFilter, semesterFilter, typeFilter]);

  // Read semester from URL on mount and when it changes
  useEffect(() => {
    const sem = searchParams.get('semester') || '';
    // Only update if different to avoid loops
    setSemesterFilter(prev => (prev !== sem ? sem : prev));
    // If a semester is in URL, go to first page to show from start
    if (sem) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchSubjects();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleAddSubject = () => {
    setEditingSubject(null);
    setNewSubject({
      name: '',
      code: '',
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

  const handleSaveSubject = async () => {
    if (!newSubject.name || !newSubject.code || !newSubject.semester) {
      toast.error('Please fill required fields: name, code, semester');
      return;
    }

    try {
      const subjectData = {
        ...newSubject,
        credits: Number(newSubject.credits),
        instructor_id: newSubject.instructor || null,
      };

      if (editingSubject) {
        const { data } = await api.put(`/subjects/${editingSubject.id}`, subjectData);
        toast.success('Subject updated successfully');
        setSubjects(prev => prev.map(s => (s.id === editingSubject.id ? data : s)));
      } else {
        const { data } = await api.post('/subjects', subjectData);
        toast.success('Subject added successfully');
        
        if (subjects.length < limit && page === totalPages) {
          setSubjects(prev => [...prev, data]);
          setTotal(prev => prev + 1);
        } else {
          setPage(1);
          await fetchSubjects();
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save subject';
      toast.error(msg);
    }
  };

  const requestDeleteSubject = (id: number) => {
    setConfirmMessage('Are you sure you want to delete this subject? This action cannot be undone.');
    setConfirmAction(() => async () => {
      try {
        await api.delete(`/subjects/${id}`);
        toast.success('Subject deleted successfully');
        if (subjects.length === 1 && page > 1) {
          setPage(p => p - 1);
        } else {
          await fetchSubjects();
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to delete subject');
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  

  const filteredSubjects = subjects; // server-side filtering

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects Management</h1>
        <div className="flex gap-2">
          <button
            onClick={handleAddSubject}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Subject
          </button>
        </div>

      {/* Global Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirm Deletion"
        message={confirmMessage}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setConfirmOpen(false);
        }}
        onClose={() => setConfirmOpen(false)}
      />
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <select
          value={departmentFilter}
          onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
        >
          <option value="">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Electronics">Electronics</option>
          <option value="Mechanical">Mechanical</option>
          <option value="Civil">Civil</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Physics">Physics</option>
          <option value="Chemistry">Chemistry</option>
          <option value="English">English</option>
          <option value="Management">Management</option>
        </select>
        <select
          value={semesterFilter}
          onChange={(e) => {
            const value = e.target.value;
            setSemesterFilter(value);
            setPage(1);
            const next = new URLSearchParams(searchParams);
            if (value) {
              next.set('semester', value);
            } else {
              next.delete('semester');
            }
            setSearchParams(next, { replace: true });
          }}
          className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
        >
          <option value="">All Semesters</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
          <option value="3">Semester 3</option>
          <option value="4">Semester 4</option>
          <option value="5">Semester 5</option>
          <option value="6">Semester 6</option>
          <option value="7">Semester 7</option>
          <option value="8">Semester 8</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
        >
          <option value="">All Types</option>
          <option value="core">Core</option>
          <option value="elective">Elective</option>
          <option value="lab">Laboratory</option>
          <option value="project">Project</option>
        </select>
        <button
          onClick={() => {
            setDepartmentFilter('');
            setSemesterFilter('');
            setTypeFilter('');
            setPage(1);
            const next = new URLSearchParams(searchParams);
            next.delete('semester');
            setSearchParams(next, { replace: true });
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Clear Filters
        </button>
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No subjects found</td>
                </tr>
              ) : filteredSubjects.map((subject) => (
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
                        onClick={() => requestDeleteSubject(subject.id)}
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

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {subjects.length > 0 ? (page - 1) * limit + 1 : 0}-{(page - 1) * limit + subjects.length} of {total}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={limit}
            onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            {(() => {
              const btns = [] as React.ReactNode[];
              const maxButtons = 5;
              let start = Math.max(1, page - 2);
              let end = Math.min(totalPages, start + maxButtons - 1);
              if (end - start + 1 < maxButtons) {
                start = Math.max(1, end - maxButtons + 1);
              }
              for (let p = start; p <= end; p++) {
                btns.push(
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded border text-sm ${
                      p === page
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
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>
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
                {/* Department field removed: department_id is auto-set from the department admin context on the backend */}
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
