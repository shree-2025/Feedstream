import React from 'react';
import Button from '../../components/ui/button/Button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';

const departments = [
  {
    id: '1',
    name: 'Computer Science',
    head: 'Dr. Alan Turing',
    staffCount: 15,
    status: 'Active',
  },
  {
    id: '2',
    name: 'Mechanical Engineering',
    head: 'Dr. Ada Lovelace',
    staffCount: 12,
    status: 'Active',
  },
  {
    id: '3',
    name: 'Physics',
    head: 'Dr. Marie Curie',
    staffCount: 8,
    status: 'Active',
  },
];

const DepartmentManagement: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Department Management</h1>
        <Button>Add New Department</Button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="text-gray-900 dark:text-white font-semibold">Department Name</TableCell>
              <TableCell isHeader className="text-gray-900 dark:text-white font-semibold">Department Head</TableCell>
              <TableCell isHeader className="text-gray-900 dark:text-white font-semibold">Staff Count</TableCell>
              <TableCell isHeader className="text-gray-900 dark:text-white font-semibold">Status</TableCell>
              <TableCell isHeader className="text-right text-gray-900 dark:text-white font-semibold">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className="font-medium text-gray-900 dark:text-white">{dept.name}</TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{dept.head}</TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{dept.staffCount}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      dept.status === 'Active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {dept.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DepartmentManagement;
