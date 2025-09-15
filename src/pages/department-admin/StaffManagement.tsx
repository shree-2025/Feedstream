import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { UserPlus, Upload, LayoutGrid, List, Search, Eye, FileText, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/button/Button';
import { useModal } from '../../hooks/useModal';
import { Modal } from '../../components/ui/modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const StaffManagement: React.FC = () => {
  const { isOpen: isAddStaffModalOpen, openModal: openAddStaffModal, closeModal: closeAddStaffModal } = useModal();
  const { isOpen: isBulkAddModalOpen, openModal: openBulkAddModal, closeModal: closeBulkAddModal } = useModal();
  const { isOpen: isViewModalOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal();
  const { isOpen: isSubjectsModalOpen, openModal: openSubjectsModal, closeModal: closeSubjectsModal } = useModal();
  const [view, setView] = useState<'list' | 'card'>('list');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedStaffForSubjects, setSelectedStaffForSubjects] = useState<any>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [formKey, setFormKey] = useState<number>(0); // force re-mount form to apply defaultValue
  // Read formKey to satisfy TS "unused" heuristic in some setups
  void formKey;

  // Dynamic subjects loaded from Subject Management (DB)
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  const loadAvailableSubjects = async () => {
    try {
      const { data } = await api.get('/subjects', {
        params: { page: 1, limit: 1000, order: 'asc' },
      });
      const names: string[] = (data?.items || []).map((s: any) => s.name).filter(Boolean);
      setAvailableSubjects(names);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load subjects');
    }
  };

  useEffect(() => {
    loadAvailableSubjects();
  }, []);

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleAddStaffModalClose = () => {
    setSelectedSubjects([]);
    closeAddStaffModal();
  };

  const handleViewStaff = (staff: any) => {
    setSelectedStaff(staff);
    openViewModal();
  };

  const handleViewSubjects = (staff: any) => {
    setSelectedStaffForSubjects(staff);
    openSubjectsModal();
  };
  const [sortOrder, setSortOrder] = useState<string>('asc');
  const [sortBy, setSortBy] = useState<string>('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters + meta options
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deptOptions, setDeptOptions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  // Bulk upload state
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchStaff = async (opts?: { search?: string; order?: string; page?: number; limit?: number; sortBy?: string; department?: string; role?: string; status?: string }) => {
    setLoadingList(true);
    try {
      const search = opts?.search ?? searchTerm;
      const order = opts?.order ?? sortOrder;
      const sortByParam = opts?.sortBy ?? sortBy;
      const page = opts?.page ?? currentPage;
      const limit = opts?.limit ?? pageSize;
      const department = opts?.department ?? departmentFilter;
      const role = opts?.role ?? roleFilter;
      const status = opts?.status ?? statusFilter;
      const { data } = await api.get('/staff', { params: { search, order, sortBy: sortByParam, page, limit, department, role, status } });
      setStaff(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      toast.error('Failed to load staff');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOrder, sortBy, currentPage, pageSize, departmentFilter, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      fetchStaff({ search: searchTerm, page: 1, limit: pageSize });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Load filter options dynamically
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/staff/meta');
        setDeptOptions(data?.departments || []);
        setRoleOptions(data?.roles || []);
        setStatusOptions(data?.statuses || []);
      } catch (e) {
        // Non-blocking
      }
    })();
  }, []);

  const filteredAndSortedStaff = staff; // already filtered/sorted by server

  const onEditStaff = (member: any) => {
    setEditingStaff(member);
    setSelectedSubjects(member.subjects || []);
    setFormKey(prev => prev + 1);
    openAddStaffModal();
  };

  // Confirm dialog state for deletions
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const requestDeleteStaff = (member: any) => {
    setConfirmMessage(`Delete staff ${member.name}? This action cannot be undone.`);
    setConfirmAction(() => async () => {
      try {
        await api.delete(`/staff/${member.id}`);
        if (staff.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
        else fetchStaff();
        toast.success('Staff deleted');
      } catch (e) {
        toast.error('Failed to delete staff');
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  const renderListView = () => (
    <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedStaff.map((member, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{member.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleViewSubjects(member)}
                      className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title="View Assigned Subjects"
                    >
                      <Eye size={16} />
                    </button>
                  </div>

      {/* Global Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirm Deletion"
        message={confirmMessage}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => confirmAction && confirmAction()}
        onClose={() => setConfirmOpen(false)}
      />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${member.status === 'Active' 
                    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-400/30' 
                    : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-400/30'}`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewStaff(member)}
                      className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title="Show Details"
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
                      onClick={() => onEditStaff(member)}
                      className="p-2 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => requestDeleteStaff(member)}
                      className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete"
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
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredAndSortedStaff.map((member, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {member.subjects.map((subject: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${member.status === 'Active' 
                ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-400/30' 
                : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-400/30'}`}>
                {member.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{member.email}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
            <button
              onClick={() => handleViewStaff(member)}
              className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              title="Show Details"
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
              onClick={() => onEditStaff(member)}
              className="p-2 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => requestDeleteStaff(member)}
              className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <Modal isOpen={isAddStaffModalOpen} onClose={closeAddStaffModal} title="Add New Staff" size="2xl">
        <form
          key={formKey}
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const payload = {
              name: String(formData.get('name') || ''),
              email: String(formData.get('email') || ''),
              role: String(formData.get('role') || ''),
              subjects: selectedSubjects,
              status: 'Active',
            };
            if (!payload.name) { toast.error('Name is required'); return; }
            if (!payload.email) { toast.error('Email is required'); return; }
            if (!payload.role) { toast.error('Role is required'); return; }
            if (selectedSubjects.length === 0) { toast.error('Please select at least one subject'); return; }
            try {
              if (editingStaff) {
                await api.put(`/staff/${editingStaff.id}`, payload);
                toast.success('Staff updated');
              } else {
                await api.post('/staff', payload);
                toast.success('Staff added');
              }
              setSelectedSubjects([]);
              setEditingStaff(null);
              closeAddStaffModal();
              fetchStaff();
            } catch (err: any) {
              if (err?.response?.status === 409) toast.error('Email already exists');
              else toast.error('Failed to save staff');
            }
          }}
        >
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
              <input 
                type="text" 
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                placeholder="Enter full name"
                name="name"
                defaultValue={editingStaff?.name || ''}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
              <input 
                type="email" 
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                placeholder="Enter email address"
                name="email"
                defaultValue={editingStaff?.email || ''}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role *</label>
              <select name="role" defaultValue={editingStaff?.role || ''} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                <option value="">Select a role</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lab Assistant">Lab Assistant</option>
                <option value="Professor">Professor</option>
              </select>
            </div>
            {/* Department field removed: department_id is auto-set from the department admin context on the backend */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subjects *</label>
              <div className="border border-gray-300 rounded-lg p-3 dark:border-gray-600 dark:bg-gray-700">
                <div className="mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Selected subjects ({selectedSubjects.length}):</p>
                  <div className="flex flex-wrap gap-1 min-h-[24px]">
                    {selectedSubjects.length > 0 ? (
                      selectedSubjects.map((subject: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center gap-1">
                          {subject}
                          <button
                            type="button"
                            onClick={() => handleSubjectToggle(subject)}
                            className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">No subjects selected</span>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Available subjects:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {availableSubjects.map((subject: string) => (
                      <label key={subject} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject)}
                          onChange={() => handleSubjectToggle(subject)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {selectedSubjects.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Please select at least one subject</p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSubjects([]);
                setEditingStaff(null);
                handleAddStaffModalClose();
              }}
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="order-1 sm:order-2">{editingStaff ? 'Save Changes' : 'Add Staff'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isBulkAddModalOpen} onClose={closeBulkAddModal} title="Bulk Add Staff" size="xl">
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">CSV Format Requirements</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
              Your CSV file should contain the following columns:
            </p>
            <code className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              name, email, role, department, subjects (JSON array), status
            </code>
            <div className="mt-2">
              <a
                href="/api/staff/template.csv"
                className="text-xs text-blue-700 dark:text-blue-300 hover:underline"
                target="_blank" rel="noreferrer"
              >
                Download CSV template
              </a>
            </div>
          </div>
          
          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!bulkFile) { toast.error('Please choose a CSV file'); return; }
              setBulkLoading(true);
              try {
                const csv = await bulkFile.text();
                const items: any[] = [];
                const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
                if (lines.length <= 1) { throw new Error('CSV has no data rows'); }
                // Parse header to map indices
                const header = lines[0].split(',').map(h => h.trim().replace(/^\ufeff/, '').toLowerCase());
                const idx = (name: string) => header.indexOf(name);
                const iName = idx('name');
                const iEmail = idx('email');
                const iRole = idx('role');
                const iDept = idx('department');
                const iSubjects = idx('subjects');
                const iStatus = idx('status');
                for (let r = 1; r < lines.length; r++) {
                  const raw = lines[r];
                  if (!raw.trim()) continue;
                  // Basic CSV split; our template quotes fields containing commas
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
                  const get = (i: number) => (i >= 0 && i < cols.length ? cols[i].trim() : '');
                  const name = get(iName);
                  const email = get(iEmail);
                  const role = get(iRole);
                  if (!name || !email || !role) continue; // skip invalid
                  const department = get(iDept) || null;
                  let subjects: any = [];
                  const subjRaw = get(iSubjects);
                  if (subjRaw) {
                    try {
                      const parsed = JSON.parse(subjRaw);
                      if (Array.isArray(parsed)) subjects = parsed;
                    } catch {
                      // try comma-separated fallback
                      subjects = subjRaw.split(';').map(s => s.trim()).filter(Boolean);
                    }
                  }
                  const status = (get(iStatus) || 'Active');
                  items.push({ name, email, role, department, subjects, status });
                }
                if (items.length === 0) throw new Error('No valid rows parsed');
                await api.post('/staff/bulk', { items });
                toast.success(`Uploaded ${items.length} staff record(s)`);
                setBulkFile(null);
                closeBulkAddModal();
                fetchStaff();
              } catch (err: any) {
                toast.error(err?.response?.data?.message || err?.message || 'Bulk upload failed');
              } finally {
                setBulkLoading(false);
              }
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upload CSV File *</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:file:hover:bg-blue-800"
                  required
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Select a CSV file or drag and drop it here
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <Button variant="outline" onClick={closeBulkAddModal} className="order-2 sm:order-1">Cancel</Button>
              <Button type="submit" disabled={bulkLoading} className="order-1 sm:order-2">{bulkLoading ? 'Uploading...' : 'Upload & Process'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Staff Details Modal */}
      <Modal isOpen={isViewModalOpen} onClose={closeViewModal} title="Staff Details" size="3xl">
        {selectedStaff && (
          <div className="space-y-6">
            {/* Header with Photo and Basic Info */}
            <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedStaff.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedStaff.name}</h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{selectedStaff.role}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{selectedStaff.department}</p>
                <div className="mt-3">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedStaff.status === 'Active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {selectedStaff.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedStaff.email}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedStaff.phone}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedStaff.address}</p>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Professional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Qualification</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedStaff.qualification}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Experience</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedStaff.experience}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Join Date</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {selectedStaff.joinDate ? (
                      new Date(selectedStaff.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    ) : (
                      'Not set'
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Staff ID</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">STF{selectedStaff.id.toString().padStart(4, '0')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Specialization</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedStaff.specialization}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <Button variant="outline" onClick={closeViewModal} className="order-2 sm:order-1">
                Close
              </Button>
              <Button className="order-1 sm:order-2">
                <Edit size={16} className="mr-2" />
                Edit Staff
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Assigned Subjects Modal */}
      <Modal isOpen={isSubjectsModalOpen} onClose={closeSubjectsModal} title="Assigned Subjects" size="lg">
        {selectedStaffForSubjects && (
          <div className="space-y-6">
            {/* Staff Info Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {selectedStaffForSubjects.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedStaffForSubjects.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStaffForSubjects.role}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{selectedStaffForSubjects.department}</p>
              </div>
            </div>

            {/* Assigned Subjects List */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Assigned Subjects ({selectedStaffForSubjects.subjects.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedStaffForSubjects.subjects.map((subject: string, idx: number) => (
                  <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{subject}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedStaffForSubjects.subjects.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No subjects assigned to this staff member.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
              <Button variant="outline" onClick={closeSubjectsModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button onClick={openAddStaffModal}><UserPlus className="w-4 h-4 mr-2" />Add Staff</Button>
          <Button variant="outline" onClick={openBulkAddModal}><Upload className="w-4 h-4 mr-2" />Bulk Add</Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-start">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="border border-gray-300 rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[140px]"
              title="Sort By"
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
              <option value="department">Department</option>
              <option value="created_at">Created</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
              className="border border-gray-300 rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[140px]"
              title="Order"
            >
              <option value="asc">Sort A-Z</option>
              <option value="desc">Sort Z-A</option>
            </select>
            <div className="flex items-center gap-2 ml-auto md:ml-0 w-full md:w-auto justify-end">
              <Button variant={view === 'list' ? 'primary' : 'outline'} onClick={() => setView('list')}><List className="w-5 h-5" /></Button>
              <Button variant={view === 'card' ? 'primary' : 'outline'} onClick={() => setView('card')}><LayoutGrid className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>

        {/* Dynamic Filters Row */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <select
            value={departmentFilter}
            onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          >
            <option value="">All Departments</option>
            {deptOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          >
            <option value="">All Roles</option>
            {roleOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <button
            onClick={() => { setDepartmentFilter(''); setRoleFilter(''); setStatusFilter(''); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* List/Card with loading/empty states */}
      {loadingList ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
          Loading staff...
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
          No staff found
        </div>
      ) : (
        view === 'list' ? renderListView() : renderCardView()
      )}

      {/* Pagination footer - unified with Subjects.tsx */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {staff.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{(currentPage - 1) * pageSize + staff.length} of {total}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(1); }}
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
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            {(() => {
              const btns: React.ReactNode[] = [];
              const maxButtons = 5;
              const totalPages = Math.max(1, Math.ceil(total / pageSize));
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
              onClick={() => setCurrentPage(p => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))}
              disabled={currentPage >= Math.max(1, Math.ceil(total / pageSize))}
              aria-label="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
