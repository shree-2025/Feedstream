import React from 'react';

import { Eye, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/ui/button/Button';

// Mock data for student logs
const mockStudentLogs = [
  { id: 1, studentName: 'Alice Johnson', activityTitle: 'Cardiology Ward Rounds', date: '2024-01-15', status: 'Pending' },
  { id: 2, studentName: 'Bob Williams', activityTitle: 'Surgical Procedure Observation', date: '2024-01-14', status: 'Approved' },
  { id: 3, studentName: 'Charlie Brown', activityTitle: 'Pediatrics Clinic Duty', date: '2024-01-12', status: 'Pending' },
  { id: 4, studentName: 'Diana Miller', activityTitle: 'Emergency Room Shift', date: '2024-01-10', status: 'Rejected' },
  { id: 5, studentName: 'Ethan Davis', activityTitle: 'Neurology Case Study', date: '2024-01-08', status: 'Approved' },
];

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">Approved</span>;
    case 'pending':
      return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900 dark:text-yellow-200">Pending</span>;
    case 'rejected':
      return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full dark:bg-red-900 dark:text-red-200">Rejected</span>;
    default:
      return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-200">{status}</span>;
  }
};

const ViewStudentLogs: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Review Student Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Approve, reject, or view details of student-submitted activities.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Student Name</th>
                <th scope="col" className="px-6 py-3">Activity Title</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockStudentLogs.map((log) => (
                <tr key={log.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {log.studentName}
                  </th>
                  <td className="px-6 py-4">{log.activityTitle}</td>
                  <td className="px-6 py-4">{log.date}</td>
                  <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="success" size="icon" className="h-8 w-8">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewStudentLogs;
