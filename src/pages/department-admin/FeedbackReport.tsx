import React, { useState } from 'react';
import { Download, Filter, Search, ChevronDown, User, Star } from 'lucide-react';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';

// Student feedback interface
interface StudentFeedback {
  id: number;
  name: string;
  email: string;
  submitted: boolean;
  rating?: number;
  submissionDate?: string;
  comments?: string;
}

// Feedback report interface
interface FeedbackReport {
  id: number;
  staff: string;
  subject: string;
  date: string;
  responses: number;
  averageRating: number;
  status: string;
  totalStudents: number;
}

// Student feedback interface
interface StudentFeedback {
  id: number;
  name: string;
  email: string;
  submitted: boolean;
  rating?: number;
  submissionDate?: string;
  comments?: string;
}

// Feedback report interface
interface FeedbackReport {
  id: number;
  staff: string;
  subject: string;
  date: string;
  responses: number;
  averageRating: number;
  status: string;
  totalStudents: number;
}

// Student feedback interface
interface StudentFeedback {
  id: number;
  name: string;
  email: string;
  submitted: boolean;
  rating?: number;
  submissionDate?: string;
  comments?: string;
}

// Feedback report interface
interface FeedbackReport {
  id: number;
  staff: string;
  subject: string;
  date: string;
  responses: number;
  averageRating: number;
  status: string;
  totalStudents: number;
}

const FeedbackReport: React.FC = () => {
  // State for modal visibility and selected report
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FeedbackReport | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(5);

  // Sample data for the table - used in the table and modal
  const feedbackData: FeedbackReport[] = [
    {
      id: 1,
      staff: 'Dr. Sarah Johnson',
      subject: 'Introduction to Computer Science',
      date: '2025-06-15',
      responses: 45,
      totalStudents: 50,
      averageRating: 4.2,
      status: 'Completed'
    },
    {
      id: 2,
      staff: 'Prof. Michael Chen',
      subject: 'Data Structures and Algorithms',
      date: '2025-07-20',
      responses: 38,
      totalStudents: 42,
      averageRating: 4.5,
      status: 'Completed'
    },
    {
      id: 3,
      staff: 'Dr. Emily Wilson',
      subject: 'Database Systems',
      date: '2025-08-18',
      responses: 0,
      totalStudents: 7,
      averageRating: 0,
      status: 'In Progress'
    }
  ];

  // Sample student feedback data
  const studentFeedback: StudentFeedback[] = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', submitted: true, rating: 5, submissionDate: '2025-08-20', comments: 'Great course, learned a lot!' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', submitted: true, rating: 4, submissionDate: '2025-08-20', comments: 'Good content and delivery' },
    { id: 3, name: 'Robert Johnson', email: 'robert.j@example.com', submitted: true, rating: 5, submissionDate: '2025-08-19', comments: 'Excellent instructor' },
    { id: 4, name: 'Emily Davis', email: 'emily.d@example.com', submitted: true, rating: 3, submissionDate: '2025-08-19', comments: 'Course was okay' },
    { id: 6, name: 'Sarah Wilson', email: 'sarah.w@example.com', submitted: false },
    { id: 7, name: 'David Lee', email: 'david.lee@example.com', submitted: false },
  ];

  // Handle view button click - used in the table row click handler
  const handleViewClick = (report: FeedbackReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
    setCurrentPage(1);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Pagination logic
  const totalStudents = studentFeedback.length;
  const totalFeedbackPages = Math.ceil(totalStudents / studentsPerPage);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = studentFeedback.slice(indexOfFirstStudent, indexOfLastStudent);

  return (
    <div className="space-y-6 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and manage all feedback reports
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter size={16} />
              <span>Filter</span>
              <ChevronDown size={16} />
            </Button>
            <Button className="flex items-center gap-2">
              <Download size={16} />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search reports..."
            />
          </div>
        </div>

        {/* Feedback Reports Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Staff
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Responses
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {feedbackData.map((report) => (
                  <tr 
                    key={report.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleViewClick(report)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{report.staff}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{report.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {report.responses} / {report.totalStudents} students
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClick(report);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">1</span> to{' '}
            <span className="font-medium">
              {Math.min(5, feedbackData.length)}
            </span> of <span className="font-medium">{feedbackData.length}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronDown className="h-5 w-5 transform rotate-90" />
            </button>
            {Array.from({ length: totalFeedbackPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === pageNum
                    ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalFeedbackPages))}
              disabled={currentPage === totalFeedbackPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ChevronDown className="h-5 w-5 transform -rotate-90" />
            </button>
          </nav>
        </div>
      </div>

      {/* Student Feedback Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={
            selectedReport 
              ? `Feedback for ${selectedReport?.subject || 'Unknown'} (${selectedReport?.staff || 'Unknown'})` 
              : 'Feedback Details'
          }
        >
          <div className="space-y-4">
            <div className="overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Student Feedback
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  View and manage student feedback for this report
                </p>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Rating
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Submission Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <User size={16} />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              student.submitted 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {student.submitted ? 'Submitted' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {student.rating ? (
                                <>
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  <span className="ml-1 text-sm text-gray-900 dark:text-white">
                                    {student.rating.toFixed(1)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {student.submissionDate || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FeedbackReport;
