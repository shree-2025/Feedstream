import React, { useState, useMemo } from 'react';
import { UserPlus, Upload, LayoutGrid, List, Search, Eye, FileText, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/ui/button/Button';
import { useModal } from '../../hooks/useModal';
import { Modal } from '../../components/ui/modal';

const StaffManagement: React.FC = () => {
  const { isOpen: isAddStaffModalOpen, openModal: openAddStaffModal, closeModal: closeAddStaffModal } = useModal();
  const { isOpen: isBulkAddModalOpen, openModal: openBulkAddModal, closeModal: closeBulkAddModal } = useModal();
  const { isOpen: isViewModalOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal();
  const { isOpen: isSubjectsModalOpen, openModal: openSubjectsModal, closeModal: closeSubjectsModal } = useModal();
  const [view, setView] = useState<'list' | 'card'>('list');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedStaffForSubjects, setSelectedStaffForSubjects] = useState<any>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const availableSubjects = [
    'Data Structures', 'Algorithms', 'Database Systems', 'Computer Networks',
    'Operating Systems', 'Software Engineering', 'Machine Learning', 'Artificial Intelligence',
    'Web Development', 'Mobile Development', 'Digital Electronics', 'VLSI Design',
    'Signal Processing', 'Communication Systems', 'Mathematics', 'Physics',
    'Chemistry', 'English', 'Management', 'Data Science', 'Network Security'
  ];

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
  const [searchTerm, setSearchTerm] = useState('');

  const staff = [
    { 
      id: 1,
      name: 'John Doe', 
      email: 'john.doe@example.com', 
      role: 'Lecturer', 
      status: 'Active',
      department: 'Computer Science',
      subjects: ['Data Structures', 'Algorithms'],
      phone: '+1 (555) 123-4567',
      joinDate: '2020-08-15',
      address: '123 Main St, City, State 12345',
      qualification: 'M.Tech Computer Science',
      experience: '5 years',
      specialization: 'Data Structures, Algorithms'
    },
    { 
      id: 2,
      name: 'Jane Smith', 
      email: 'jane.smith@example.com', 
      role: 'Assistant Professor', 
      status: 'Active',
      department: 'Information Technology',
      subjects: ['Machine Learning', 'Artificial Intelligence', 'Data Science'],
      phone: '+1 (555) 234-5678',
      joinDate: '2019-01-10',
      address: '456 Oak Ave, City, State 12345',
      qualification: 'Ph.D Information Technology',
      experience: '8 years',
      specialization: 'Machine Learning, AI'
    },
    { 
      id: 3,
      name: 'Peter Jones', 
      email: 'peter.jones@example.com', 
      role: 'Lab Assistant', 
      status: 'Inactive',
      department: 'Computer Science',
      subjects: ['Computer Networks', 'Network Security'],
      phone: '+1 (555) 345-6789',
      joinDate: '2021-03-22',
      address: '789 Pine St, City, State 12345',
      qualification: 'B.Tech Computer Science',
      experience: '2 years',
      specialization: 'Hardware, Networking'
    },
    { 
      id: 4,
      name: 'Alice Williams', 
      email: 'alice.w@example.com', 
      role: 'Lecturer', 
      status: 'Active',
      department: 'Electronics',
      subjects: ['Digital Electronics', 'VLSI Design'],
      phone: '+1 (555) 456-7890',
      joinDate: '2020-11-05',
      address: '321 Elm St, City, State 12345',
      qualification: 'M.Tech Electronics',
      experience: '4 years',
      specialization: 'Digital Electronics, VLSI'
    },
    { 
      id: 5,
      name: 'Bob Brown', 
      email: 'bob.b@example.com', 
      role: 'Professor', 
      status: 'Active',
      department: 'Computer Science',
      subjects: ['Database Systems', 'Software Engineering', 'Web Development'],
      phone: '+1 (555) 567-8901',
      joinDate: '2015-07-01',
      address: '654 Maple Ave, City, State 12345',
      qualification: 'Ph.D Computer Science',
      experience: '12 years',
      specialization: 'Software Engineering, Database Systems'
    },
  ];

  const filteredAndSortedStaff = useMemo(() => {
    return staff
      .filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (a.name < b.name) return sortOrder === 'asc' ? -1 : 1;
        if (a.name > b.name) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [staff, searchTerm, sortOrder]);

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
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
                      className="p-2 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
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
                  {member.subjects.map((subject, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
              className="p-2 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button
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
      <Modal isOpen={isAddStaffModalOpen} onClose={closeAddStaffModal} title="Add New Staff">
        <form className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
              <input 
                type="text" 
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
              <input 
                type="email" 
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role *</label>
              <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                <option value="">Select a role</option>
                <option value="lecturer">Lecturer</option>
                <option value="assistant-professor">Assistant Professor</option>
                <option value="lab-assistant">Lab Assistant</option>
                <option value="professor">Professor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <input 
                type="text" 
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                placeholder="Enter department"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subjects *</label>
              <div className="border border-gray-300 rounded-lg p-3 dark:border-gray-600 dark:bg-gray-700">
                <div className="mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Selected subjects ({selectedSubjects.length}):</p>
                  <div className="flex flex-wrap gap-1 min-h-[24px]">
                    {selectedSubjects.length > 0 ? (
                      selectedSubjects.map((subject, idx) => (
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
                    {availableSubjects.map((subject) => (
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
            <Button variant="outline" onClick={handleAddStaffModalClose} className="order-2 sm:order-1">Cancel</Button>
            <Button type="submit" className="order-1 sm:order-2">Add Staff</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isBulkAddModalOpen} onClose={closeBulkAddModal} title="Bulk Add Staff">
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">CSV Format Requirements</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
              Your CSV file should contain the following columns:
            </p>
            <code className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              Name, Email, Role, Department, Subjects (comma-separated), Phone (optional)
            </code>
          </div>
          
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upload CSV File *</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <input 
                  type="file" 
                  accept=".csv"
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
              <Button type="submit" className="order-1 sm:order-2">Upload & Process</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Staff Details Modal */}
      <Modal isOpen={isViewModalOpen} onClose={closeViewModal} title="Staff Details">
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
                    {new Date(selectedStaff.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
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
      <Modal isOpen={isSubjectsModalOpen} onClose={closeSubjectsModal} title="Assigned Subjects">
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
