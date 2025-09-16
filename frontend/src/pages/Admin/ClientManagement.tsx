import { Card } from "../../components/ui/card";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Search, Edit, Trash2, X, Building2, Mail, Phone, User, Upload, UserPlus } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { useState } from "react";

interface Client {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Pending';
  assignedTo: string;
  joinDate: string;
}

export default function ClientManagement() {
  // State for clients and modal
  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      name: 'Acme Corporation',
      contact: 'John Smith',
      email: 'john@acme.com',
      phone: '(123) 456-7890',
      status: 'Active',
      assignedTo: 'Admin User',
      joinDate: '2023-01-15',
    },
    {
      id: 2,
      name: 'Globex Corp',
      contact: 'Sarah Johnson',
      email: 'sarah@globex.com',
      phone: '(234) 567-8901',
      status: 'Active',
      assignedTo: 'Manager One',
      joinDate: '2023-02-20',
    },
    {
      id: 3,
      name: 'Initech',
      contact: 'Michael Scott',
      email: 'michael@initech.com',
      phone: '(345) 678-9012',
      status: 'Pending',
      assignedTo: 'Manager Two',
      joinDate: '2023-03-10',
    },
    {
      id: 4,
      name: 'Umbrella Corp',
      contact: 'Alice Johnson',
      email: 'alice@umbrella.com',
      phone: '(456) 789-0123',
      status: 'Inactive',
      assignedTo: 'Admin User',
      joinDate: '2022-11-05',
    },
    {
      id: 5,
      name: 'Stark Industries',
      contact: 'Tony Stark',
      email: 'tony@stark.com',
      phone: '(567) 890-1234',
      status: 'Active',
      assignedTo: 'Manager One',
      joinDate: '2023-01-30',
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state for Add/Edit Client
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'joinDate'> & { id?: number }>({
    name: '',
    contact: '',
    email: '',
    phone: '',
    status: 'Active',
    assignedTo: '',
  });

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      // Update existing client
      setClients(clients.map(c => c.id === formData.id ? { ...formData, id: formData.id } as Client : c));
    } else {
      // Add new client
      const newClient: Client = {
        ...formData as Omit<Client, 'id' | 'joinDate'>,
        id: Math.max(...clients.map(c => c.id), 0) + 1,
        joinDate: new Date().toISOString().split('T')[0]
      };
      setClients([...clients, newClient]);
    }
    setIsAddModalOpen(false);
    setFormData({ name: '', contact: '', email: '', phone: '', status: 'Active', assignedTo: '' });
  };

  const handleEdit = (client: Client) => {
    setFormData(client);
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setSelectedClient(clients.find(c => c.id === id) || null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedClient) {
      setClients(clients.filter(c => c.id !== selectedClient.id));
      setIsDeleteModalOpen(false);
      setSelectedClient(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title="Client Management | FillDMS"
        description="Manage client accounts and information"
      />
      <Card className="p-4 shadow-sm border rounded-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Title */}
          <h1 className="text-2xl font-semibold tracking-tight">Client Management</h1>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-[220px] lg:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search clients..."
                className="pl-9 pr-3 py-2 w-full rounded-md border focus:ring-2 focus:ring-primary/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button> 
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsAddModalOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                Add Client
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned User
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <TableRow  className="hover:bg-gray-50">
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.name}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.contact}</div>
                    <div className="text-xs text-gray-500">{client.email}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {client.phone}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      client.status === 'Active' ? 'bg-green-100 text-green-800' :
                      client.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {client.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 mr-2">
                        {client.assignedTo.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      {client.assignedTo}
                    </div>
                  </TableCell>
                
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.joinDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(client)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell className="px-4 py-8 text-center text-sm text-gray-500 w-full">
                    No clients found. Try adjusting your search or add a new client.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {formData.id ? 'Edit Client' : 'Add New Client'}
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Acme Corporation"
                        className="pl-9 w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        placeholder="John Smith"
                        className="pl-9 w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contact@example.com"
                        className="pl-9 w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(123) 456-7890"
                        className="pl-9 w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button>
                    {formData.id ? 'Update Client' : 'Add Client'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete <span className="font-semibold">{selectedClient.name}</span>? 
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={confirmDelete}
                >
                  Delete Client
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}