import React, { useState } from 'react';
import { Plus, Upload, FileText, BarChart2, Search, UserCircle2, LayoutGrid, List, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import Tooltip from '../../components/ui/tooltip/Tooltip';
import { useModal } from '../../hooks/useModal';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

type Student = {
  id: string;
  name: string;
  email: string;
  major: string;
  status: string;
};

const initialStudents: Student[] = [
  {
    id: '1',
    name: 'Ella Vance',
    email: 'ella.vance@example.com',
    major: 'Cardiology',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Markus Crane',
    email: 'markus.crane@example.com',
    major: 'Neurology',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Sophia Loren',
    email: 'sophia.loren@example.com',
    major: 'Pediatrics',
    status: 'Completed Residency',
  },
];

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const { isOpen: isAddStudentModalOpen, openModal: openAddStudentModal, closeModal: closeAddStudentModal } = useModal();
  const { isOpen: isBulkUploadModalOpen, openModal: openBulkUploadModal, closeModal: closeBulkUploadModal } = useModal();
  const { isOpen: isViewLogsModalOpen, openModal: openViewLogsModal, closeModal: closeViewLogsModal } = useModal();
  const { isOpen: isReportModalOpen, openModal: openReportModal, closeModal: closeReportModal } = useModal();
  const { isOpen: isEditStudentModalOpen, openModal: openEditStudentModal, closeModal: closeEditStudentModal } = useModal();
  const { isOpen: isDeleteConfirmModalOpen, openModal: openDeleteConfirmModal, closeModal: closeDeleteConfirmModal } = useModal();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', major: '' });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [sortOrder, setSortOrder] = useState('name-asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('card');

  const filteredStudents = students
    .filter((student) => {
      const searchMatch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.major.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === 'all' || student.status === statusFilter;

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      if (sortOrder === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortOrder === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingStudent) {
      setEditingStudent(prev => prev ? { ...prev, [name]: value } : null);
    } else {
      setNewStudent(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleViewLogs = (student: Student) => {
    setSelectedStudent(student);
    openViewLogsModal();
  };

  const handleGenerateReport = (student: Student) => {
    setSelectedStudent(student);
    openReportModal();
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    openEditStudentModal();
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    openDeleteConfirmModal();
  };

  const handleSaveStudent = () => {
    setStudents(prev => [...prev, { ...newStudent, id: String(prev.length + 1), status: 'Enrolled' }]);
    setNewStudent({ name: '', email: '', major: '' });
    closeAddStudentModal();
  };

  const handleUpdateStudent = () => {
    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
      closeEditStudentModal();
    }
  };

  const handleConfirmDelete = () => {
    if (selectedStudent) {
      setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
      closeDeleteConfirmModal();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Logic to process CSV will be added here
      console.log('Uploading file:', file.name);
      closeBulkUploadModal();
    }
  };

  const sampleCsvData = "name,email,specialization\nLiam Smith,liam.smith@example.com,Cardiology\nAva Johnson,ava.johnson@example.com,Neurology";
  const sampleCsvBlob = new Blob([sampleCsvData], { type: 'text/csv' });
  const sampleCsvUrl = URL.createObjectURL(sampleCsvBlob);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h1>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button onClick={openAddStudentModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Student
          </Button>
          <Button variant="outline" onClick={openBulkUploadModal}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-grow">
          <Input
            type="text"
            placeholder="Search students..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Sort: Name A-Z</SelectItem>
              <SelectItem value="name-desc">Sort: Name Z-A</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Filter: All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Completed Residency">Completed Residency</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
            <Button variant={viewMode === 'card' ? 'primary' : 'outline'} size="sm" onClick={() => setViewMode('card')} className="rounded-r-none">
              <LayoutGrid className="w-5 h-5" />
            </Button>
            <Button variant={viewMode === 'list' ? 'primary' : 'outline'} size="sm" onClick={() => setViewMode('list')} className="rounded-l-none">
              <List className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div key={student.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between transition-transform transform hover:scale-105">
                <div className="flex items-center space-x-4">
                  <UserCircle2 className="w-12 h-12 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{student.name}</h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          student.status === 'Active'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {student.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{student.email}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{student.major}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 mt-6">
                  <Tooltip text="View Logs">
                    <Button variant="outline" size="icon" onClick={() => handleViewLogs(student)}>
                      <FileText className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip text="Generate Report">
                    <Button variant="outline" size="icon" onClick={() => handleGenerateReport(student)}>
                      <BarChart2 className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip text="Edit">
                    <Button variant="outline" size="icon" onClick={() => handleEditStudent(student)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip text="Delete">
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteStudent(student)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No students found.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 dark:border-gray-700">
                <TableCell isHeader className="px-6 py-3 text-left text-gray-900 dark:text-white font-semibold">Student Name</TableCell>
                <TableCell isHeader className="px-6 py-3 text-left text-gray-900 dark:text-white font-semibold">Email</TableCell>
                <TableCell isHeader className="px-6 py-3 text-left text-gray-900 dark:text-white font-semibold">Specialization</TableCell>
                <TableCell isHeader className="px-6 py-3 text-left text-gray-900 dark:text-white font-semibold">Status</TableCell>
                <TableCell isHeader className="px-6 py-3 text-right text-gray-900 dark:text-white font-semibold">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <TableCell className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{student.name}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-700 dark:text-gray-300">{student.email}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-700 dark:text-gray-300">{student.major}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'Active'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Tooltip text="View Logs">
                        <Button variant="outline" size="icon" onClick={() => handleViewLogs(student)}>
                          <FileText className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip text="Generate Report">
                        <Button variant="outline" size="icon" onClick={() => handleGenerateReport(student)}>
                          <BarChart2 className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip text="Edit">
                        <Button variant="outline" size="icon" onClick={() => handleEditStudent(student)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip text="Delete">
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteStudent(student)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Student Modal */}
      <Modal isOpen={isAddStudentModalOpen} onClose={closeAddStudentModal} title="Add New Student">
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" name="name" value={newStudent.name} onChange={handleFormChange} className="col-span-3" placeholder="e.g., John Doe" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" name="email" type="email" value={newStudent.email} onChange={handleFormChange} className="col-span-3" placeholder="e.g., john.doe@example.com" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="major" className="text-right">Specialization</Label>
            <Input id="major" name="major" value={newStudent.major} onChange={handleFormChange} className="col-span-3" placeholder="e.g., Cardiology" />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={closeAddStudentModal}>Cancel</Button>
            <Button onClick={handleSaveStudent}>Save Student</Button>
          </div>
        </div>
      </Modal>

      {/* View Logs Modal */}
      {selectedStudent && (
        <Modal isOpen={isViewLogsModalOpen} onClose={closeViewLogsModal} title={`Logs for ${selectedStudent.name}`}>
          <div className="text-center">
            <p>This is where the student's logs will be displayed.</p>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={closeViewLogsModal}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Generate Report Modal */}
      {selectedStudent && (
        <Modal isOpen={isReportModalOpen} onClose={closeReportModal} title={`Report for ${selectedStudent.name}`}>
          <div className="text-center">
            <p>This is where the student's report will be generated and displayed.</p>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={closeReportModal}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Upload Modal */}
      <Modal isOpen={isBulkUploadModalOpen} onClose={closeBulkUploadModal} title="Bulk Upload Students">
        <div className="grid gap-4 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 col-span-4">
            Upload a CSV file with student information. The file should contain the following columns: `name`, `email`, and `specialization`.
          </p>
          <div className="col-span-4">
            <a href={sampleCsvUrl} download="sample_students.csv" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              Download Sample CSV File
            </a>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="csv-file" className="text-right">CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileUpload} className="col-span-3" />
          </div>
          <div className="flex justify-end pt-4 col-span-4">
            <Button variant="outline" onClick={closeBulkUploadModal}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      {editingStudent && (
        <Modal isOpen={isEditStudentModalOpen} onClose={closeEditStudentModal} title={`Edit ${editingStudent.name}`}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-edit" className="text-right">Name</Label>
              <Input id="name-edit" name="name" value={editingStudent.name} onChange={handleFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email-edit" className="text-right">Email</Label>
              <Input id="email-edit" name="email" type="email" value={editingStudent.email} onChange={handleFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="major-edit" className="text-right">Specialization</Label>
              <Input id="major-edit" name="major" value={editingStudent.major} onChange={handleFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status-edit" className="text-right">Status</Label>
              <Select name="status" value={editingStudent.status} onValueChange={(value) => handleFormChange({ target: { name: 'status', value } } as any)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed Residency">Completed Residency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={closeEditStudentModal}>Cancel</Button>
              <Button onClick={handleUpdateStudent}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {selectedStudent && (
        <Modal isOpen={isDeleteConfirmModalOpen} onClose={closeDeleteConfirmModal} title="Confirm Deletion">
          <div className="space-y-4">
            <p>Are you sure you want to delete the student "{selectedStudent.name}"? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={closeDeleteConfirmModal}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentManagement;
