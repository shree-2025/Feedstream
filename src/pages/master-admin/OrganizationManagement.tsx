import React from 'react';
import Button from '../../components/ui/button/Button'; // Corrected: Default import
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table'; // Corrected: Removed TableHead

const organizations = [
  {
    id: '1',
    name: 'Greenwood High',
    admin: 'Alice Johnson',
    email: 'alice@greenwood.edu',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Northside College',
    admin: 'Bob Williams',
    email: 'bob@northside.edu',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Eastwood Academy',
    admin: 'Charlie Brown',
    email: 'charlie@eastwood.com',
    status: 'Inactive',
  },
];

const OrganizationManagement: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization Management</h1>
        <Button>Add New Organization</Button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="text-gray-900 dark:text-white font-semibold">Organization Name</TableCell>
              <TableCell isHeader className="text-gray-900 dark:text-white font-semibold">Admin</TableCell>
              <TableCell isHeader className="text-gray-900 dark:text-white font-semibold">Contact Email</TableCell>
              <TableCell isHeader className="text-gray-900 dark:text-white font-semibold">Status</TableCell>
              <TableCell isHeader className="text-right text-gray-900 dark:text-white font-semibold">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium text-gray-900 dark:text-white">{org.name}</TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{org.admin}</TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{org.email}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      org.status === 'Active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {org.status}
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

export default OrganizationManagement;
