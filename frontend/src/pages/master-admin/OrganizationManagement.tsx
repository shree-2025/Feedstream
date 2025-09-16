import React, { useState } from 'react';
import { useModal } from '../../hooks/useModal';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Edit } from 'lucide-react';
import Tooltip from '../../components/ui/tooltip/Tooltip';
import Button from '../../components/ui/button/Button'; // Corrected: Default import
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table'; // Corrected: Removed TableHead

const initialOrganizations = [
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
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [editingOrg, setEditingOrg] = useState<typeof initialOrganizations[0] | null>(null);
  const [newOrg, setNewOrg] = useState({ name: '', admin: '', email: '' });
  const { isOpen: isAddOrgModalOpen, openModal: openAddOrgModal, closeModal: closeAddOrgModal } = useModal();
  const { isOpen: isEditOrgModalOpen, openModal: openEditOrgModal, closeModal: closeEditOrgModal } = useModal();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (editingOrg) {
      setEditingOrg({ ...editingOrg, [id.replace('-edit', '')]: value });
    } else {
      setNewOrg({ ...newOrg, [id]: value });
    }
  };

  const handleStatusChange = (value: string) => {
    if (editingOrg) {
      setEditingOrg({ ...editingOrg, status: value });
    }
  };

  const handleSaveNewOrg = () => {
    setOrganizations([...organizations, { ...newOrg, id: String(organizations.length + 1), status: 'Active' }]);
    setNewOrg({ name: '', admin: '', email: '' });
    closeAddOrgModal();
  };

  const handleUpdateOrg = () => {
    if (editingOrg) {
      setOrganizations(organizations.map(org => org.id === editingOrg.id ? editingOrg : org));
      closeEditOrgModal();
    }
  };

  const handleEditClick = (org: typeof initialOrganizations[0]) => {
    setEditingOrg(org);
    openEditOrgModal();
  };
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization Management</h1>
        <Button onClick={openAddOrgModal}>Add New Organization</Button>
      </div>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <Table className="min-w-full">
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
                  <Tooltip text="Edit">
                  <Button variant="outline" size="icon" onClick={() => handleEditClick(org)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isAddOrgModalOpen} onClose={closeAddOrgModal} title="Add New Organization">
        <form className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="org-name" className="text-right">Organization Name</Label>
            <Input id="name" placeholder="e.g., Greenwood High" className="col-span-3" value={newOrg.name} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="admin-name" className="text-right">Admin Name</Label>
            <Input id="admin" placeholder="e.g., Alice Johnson" className="col-span-3" value={newOrg.admin} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="admin-email" className="text-right">Contact Email</Label>
            <Input id="email" type="email" placeholder="e.g., alice@greenwood.edu" className="col-span-3" value={newOrg.email} onChange={handleInputChange} />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={closeAddOrgModal}>Cancel</Button>
            <Button onClick={handleSaveNewOrg}>Save Organization</Button>
          </div>
        </form>
      </Modal>

      {editingOrg && (
        <Modal isOpen={isEditOrgModalOpen} onClose={closeEditOrgModal} title={`Edit ${editingOrg.name}`}>
          <form className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="org-name-edit" className="text-right">Organization Name</Label>
              <Input id="name-edit" value={editingOrg.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin-name-edit" className="text-right">Admin Name</Label>
              <Input id="admin-edit" value={editingOrg.admin} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin-email-edit" className="text-right">Contact Email</Label>
              <Input id="email-edit" type="email" value={editingOrg.email} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status-edit" className="text-right">Status</Label>
              <Select value={editingOrg.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={closeEditOrgModal}>Cancel</Button>
              <Button onClick={handleUpdateOrg}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OrganizationManagement;
