import React from 'react';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import Button from '../../components/ui/button/Button';
import { Link } from 'react-router-dom';

// Mock data for activities
const mockActivities = [
  { id: 1, title: 'International AI Conference', type: 'Conference', date: '2024-01-15', status: 'Approved' },
  { id: 2, title: 'Research Paper on LLMs', type: 'Paper Publication', date: '2024-01-14', status: 'Pending' },
  { id: 3, title: 'Advanced React Workshop', type: 'Workshop', date: '2024-01-12', status: 'Approved' },
  { id: 4, title: 'Guest Lecture on Quantum Computing', type: 'Seminar', date: '2024-01-10', status: 'Rejected' },
  { id: 5, title: 'Project Demo Day', type: 'Other', date: '2024-01-08', status: 'Approved' },
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

const ManageActivities: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Activities</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View, edit, or delete your submitted activities.</p>
        </div>
        <Link to="/student/submit-activity">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Submit New Activity
          </Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Activity Title</th>
                <th scope="col" className="px-6 py-3">Type</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockActivities.map((activity) => (
                <tr key={activity.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {activity.title}
                  </th>
                  <td className="px-6 py-4">{activity.type}</td>
                  <td className="px-6 py-4">{activity.date}</td>
                  <td className="px-6 py-4">{getStatusBadge(activity.status)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8">
                      <Trash2 className="w-4 h-4" />
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

export default ManageActivities;
