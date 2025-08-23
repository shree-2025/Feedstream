import React, { useState } from 'react';
import { Plus, Upload, FileText, BarChart2, Search, UserCircle2, LayoutGrid, List } from 'lucide-react';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';

type Student = {
  id: string;
  name: string;
  email: string;
  major: string;
  status: string;
};

const students: Student[] = [
  {
    id: '1',
    name: 'Alice Wonder',
    email: 'alice.wonder@example.com',
    major: 'Computer Science',
    status: 'Enrolled',
  },
  {
    id: '2',
    name: 'Bob Builder',
    email: 'bob.builder@example.com',
    major: 'Mechanical Engineering',
    status: 'Enrolled',
  },
  {
    id: '3',
    name: 'Charlie Chaplin',
    email: 'charlie.chaplin@example.com',
    major: 'Fine Arts',
    status: 'Graduated',
  },
];

const StudentManagement: React.FC = () => {
  const { isOpen: isAddStudentModalOpen, openModal: openAddStudentModal, closeModal: closeAddStudentModal } = useModal();
  const { isOpen: isBulkUploadModalOpen, openModal: openBulkUploadModal, closeModal: closeBulkUploadModal } = useModal();
  const { isOpen: isViewLogsModalOpen, openModal: openViewLogsModal, closeModal: closeViewLogsModal } = useModal();
  const { isOpen: isReportModalOpen, openModal: openReportModal, closeModal: closeReportModal } = useModal();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', major: '' });
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleViewLogs = (student: Student) => {
    setSelectedStudent(student);
    openViewLogsModal();
  };

  const handleGenerateReport = (student: Student) => {
    setSelectedStudent(student);
    openReportModal();
  };

  const handleSaveStudent = () => {
    // Logic to save student will be added here
    console.log('Saving student:', newStudent);
    closeAddStudentModal();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Logic to process CSV will be added here
      console.log('Uploading file:', file.name);
      closeBulkUploadModal();
    }
  };

  const sampleCsvData = "name,email,major\nJohn Doe,john.doe@example.com,Computer Science\nJane Smith,jane.smith@example.com,Data Science";
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
          <input
            type="text"
            placeholder="Search students..."
            className="w-full p-2 pl-10 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full md:w-auto p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="name-asc">Sort: Name A-Z</option>
            <option value="name-desc">Sort: Name Z-A</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">Filter: All</option>
            <option value="Enrolled">Enrolled</option>
            <option value="Graduated">Graduated</option>
          </select>
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
                          student.status === 'Enrolled'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
                  <Button variant="outline" size="sm" onClick={() => handleViewLogs(student)}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Logs
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleGenerateReport(student)}>
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
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
                <TableCell isHeader className="px-6 py-3 text-left text-gray-900 dark:text-white font-semibold">Major</TableCell>
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
                        student.status === 'Enrolled'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewLogs(student)}>
                        <FileText className="w-4 h-4 mr-2" />
                        View Logs
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleGenerateReport(student)}>
                        <BarChart2 className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Student Name</label>
            <input type="text" name="name" onChange={handleFormChange} className="input-field mt-1" placeholder="e.g., John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input type="email" name="email" onChange={handleFormChange} className="input-field mt-1" placeholder="e.g., john.doe@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Major</label>
            <input type="text" name="major" onChange={handleFormChange} className="input-field mt-1" placeholder="e.g., Computer Science" />
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
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload a CSV file with student information. The file should contain the following columns: `name`, `email`, and `major`.
          </p>
          <div>
            <a href={sampleCsvUrl} download="sample_students.csv" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              Download Sample CSV File
            </a>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload File</label>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={closeBulkUploadModal}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentManagement;
