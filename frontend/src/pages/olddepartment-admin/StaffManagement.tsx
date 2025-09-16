import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, Upload, LayoutGrid, List, Search, Eye, FileText, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/ui/button/Button';
import { useModal } from '../../hooks/useModal';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import Tooltip from '../../components/ui/tooltip/Tooltip';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const StaffManagement: React.FC = () => {
  const { isOpen: isAddStaffModalOpen, openModal: openAddStaffModal, closeModal: closeAddStaffModal } = useModal();
  const { isOpen: isBulkAddModalOpen, openModal: openBulkAddModal, closeModal: closeBulkAddModal } = useModal();
  const [view, setView] = useState('list'); // 'list' or 'card'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Array<{ id: number; name: string; email: string; status?: string }>>([]);
  // Add Staff form fields
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  // Edit/Delete state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{ id: number; name: string; email: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

  const departmentId = user?.role === 'DepartmentAdmin' ? Number(user.id) : undefined;

  async function fetchStaff() {
    if (!departmentId) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('elog_token') || '';
      const res = await fetch(`${apiBase}/departments/${departmentId}/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load staff');
      }
      const rows = await res.json();
      setStaffList(rows);
      toast.success('Staff list updated');
    } catch (e: any) {
      setError(e?.message || 'Failed to load staff');
      toast.error(e?.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }

  // Handlers for editing and deleting staff
  function openEdit(member: { id: number; name: string; email: string }) {
    setSelectedStaff(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditModalOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!departmentId || !selectedStaff) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem('elog_token') || '';
      const res = await fetch(`${apiBase}/departments/${departmentId}/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update staff');
      }
      toast.success('Staff updated');
      setEditModalOpen(false);
      setSelectedStaff(null);
      await fetchStaff();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update staff');
    } finally {
      setActionLoading(false);
    }
  }

  function openDelete(member: { id: number; name: string; email: string }) {
    setSelectedStaff(member);
    setDeleteModalOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!departmentId || !selectedStaff) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem('elog_token') || '';
      const res = await fetch(`${apiBase}/departments/${departmentId}/staff/${selectedStaff.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete staff');
      }
      toast.success('Staff deleted');
      setDeleteModalOpen(false);
      setSelectedStaff(null);
      await fetchStaff();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete staff');
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  const filteredAndSortedStaff = useMemo(() => {
    return staffList
      .filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (a.name < b.name) return sortOrder === 'asc' ? -1 : 1;
        if (a.name > b.name) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [staffList, searchTerm, sortOrder]);

  async function handleAddStaffSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!departmentId) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('elog_token') || '';
      const res = await fetch(`${apiBase}/departments/${departmentId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newStaffName.trim(), email: newStaffEmail.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add staff');
      }
      // Clear form and refresh
      setNewStaffName('');
      setNewStaffEmail('');
      closeAddStaffModal();
      await fetchStaff();
      toast.success('Staff added and invite email sent');
    } catch (e: any) {
      setError(e?.message || 'Failed to add staff');
      toast.error(e?.message || 'Failed to add staff');
    } finally {
      setLoading(false);
    }
  }

  const renderListView = () => (
    <div className="w-full bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading staff...</td>
              </tr>
            )}
            {!loading && filteredAndSortedStaff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No staff found</td>
              </tr>
            )}
            {!loading && filteredAndSortedStaff.map((member, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{member.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${'bg-green-100 text-green-800'}`}>
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center">
                  <Tooltip text="Show Details">
                    <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
                  </Tooltip>
                  <Tooltip text="Generate Report">
                    <Button variant="outline" size="icon"><FileText className="h-4 w-4" /></Button>
                  </Tooltip>
                  <Tooltip text="Edit">
                    <Button variant="outline" size="icon" onClick={() => openEdit(member as any)}><Edit className="h-4 w-4" /></Button>
                  </Tooltip>
                  <Tooltip text="Delete">
                    <Button variant="destructive" size="icon" onClick={() => openDelete(member as any)}><Trash2 className="h-4 w-4" /></Button>
                  </Tooltip>
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
      {loading && (
        <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400">Loading staff...</div>
      )}
      {!loading && filteredAndSortedStaff.length === 0 && (
        <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400">No staff found</div>
      )}
      {!loading && filteredAndSortedStaff.map((member, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Staff</p>
              </div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${'bg-green-100 text-green-800'}`}>
                Active
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{member.email}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
            <Button variant="outline" size="sm">Show Details</Button>
            <Button variant="outline" size="sm">Generate Report</Button>
            <Button variant="outline" size="sm" onClick={() => openEdit(member as any)}>Edit</Button>
            <Button variant="destructive" size="sm" onClick={() => openDelete(member as any)}>Delete</Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="p-2 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      <Modal isOpen={isAddStaffModalOpen} onClose={closeAddStaffModal} title="Add New Staff">
        <form className="grid gap-4 py-4 text-gray-800 dark:text-white" onSubmit={handleAddStaffSubmit}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right dark:text-white">Full Name</Label>
            <Input id="name" placeholder="John Doe" className="col-span-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right dark:text-white">Email</Label>
            <Input id="email" type="email" placeholder="john.doe@example.com" className="col-span-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700" value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right dark:text-white">Role</Label>
            <Select>
              <SelectTrigger className="col-span-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700">
                <SelectValue placeholder="Select a role (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lecturer">Lecturer</SelectItem>
                <SelectItem value="assistant-professor">Assistant Professor</SelectItem>
                <SelectItem value="lab-assistant">Lab Assistant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={closeAddStaffModal}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Staff'}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Staff">
        <form className="grid gap-4 py-4 text-gray-800 dark:text-white" onSubmit={handleEditSubmit}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right dark:text-white">Full Name</Label>
            <Input id="edit-name" className="col-span-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-email" className="text-right dark:text-white">Email</Label>
            <Input id="edit-email" type="email" className="col-span-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Staff">
        <div className="py-2 text-gray-800 dark:text-white">
          Are you sure you want to delete {selectedStaff?.name}? This action cannot be undone.
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDeleteConfirm} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete'}</Button>
        </div>
      </Modal>

      <Modal isOpen={isBulkAddModalOpen} onClose={closeBulkAddModal} title="Bulk Add Staff">
        <form className="grid gap-4 py-4 text-gray-800 dark:text-white">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="csv-file" className="text-right dark:text-white">CSV File</Label>
            <Input id="csv-file" type="file" className="col-span-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700" />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={closeBulkAddModal}>Cancel</Button>
            <Button>Upload</Button>
          </div>
        </form>
      </Modal>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button onClick={openAddStaffModal}><UserPlus className="w-4 h-4 mr-2" />Add Staff</Button>
          <Button variant="outline" onClick={openBulkAddModal}><Upload className="w-4 h-4 mr-2" />Bulk Add</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
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
        <div className="flex items-center gap-4">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="asc">Sort A-Z</option>
            <option value="desc">Sort Z-A</option>
          </select>
          <div className="flex items-center gap-2">
            <Button variant={view === 'list' ? 'primary' : 'outline'} onClick={() => setView('list')}><List className="w-5 h-5" /></Button>
            <Button variant={view === 'card' ? 'primary' : 'outline'} onClick={() => setView('card')}><LayoutGrid className="w-5 h-5" /></Button>
          </div>
        </div>
      </div>

      {view === 'list' ? renderListView() : renderCardView()}
    </div>
  );
};

export default StaffManagement;
