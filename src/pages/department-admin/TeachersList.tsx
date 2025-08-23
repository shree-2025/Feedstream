import React, { useState } from 'react';
// Icons are used in the JSX but TypeScript can't detect them

interface Staff {
  id: number;
  name: string;
  email: string;
  department: string;
  subject: string;
  phone: string;
  position: string;
  joiningDate: string;
}

const TeachersList: React.FC = () => {
  const [teachers, setTeachers] = useState<Staff[]>([
    { 
      id: 1, 
      name: 'Dr. Emily Carter',
      email: 'emily.carter@example.com',
      department: 'Computer Science',
      subject: 'Computer Science',
      phone: '+1-555-0123',
      position: 'Professor',
      joiningDate: '2020-08-15'
    },
    { 
      id: 2, 
      name: 'Mr. John Doe',
      email: 'john.doe@example.com',
      department: 'Mathematics',
      subject: 'Mathematics',
      phone: '+1-555-0123',
      position: 'Professor',
      joiningDate: '2020-08-15'
    },
    { 
      id: 3, 
      name: 'Ms. Jane Smith',
      email: 'jane.smith@example.com',
      department: 'Physics',
      subject: 'Physics',
      phone: '+1-555-0123',
      position: 'Professor',
      joiningDate: '2020-08-15'
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Staff | null>(null);
  const [teacherForm, setTeacherForm] = useState({ 
    name: '', 
    subject: '', 
    phone: '', 
    position: '', 
    joiningDate: '' 
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTeacherForm({ ...teacherForm, [name]: value });
  };

  const handleAddTeacher = () => {
    if (teacherForm.name.trim() && teacherForm.subject.trim()) {
      const email = `${teacherForm.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      const department = teacherForm.subject || 'General';
      
      setTeachers([...teachers, { 
        ...teacherForm, 
        id: Date.now(),
        email,
        department
      }]);
      
      setTeacherForm({ 
        name: '', 
        subject: '', 
        phone: '', 
        position: '', 
        joiningDate: '' 
      });
      setIsModalOpen(false);
    }
  };

  const handleUpdateTeacher = () => {
    if (editingTeacher && teacherForm.name.trim() && teacherForm.subject.trim()) {
      setTeachers(
        teachers.map((t: Staff) =>
          t.id === editingTeacher.id 
            ? { 
                ...t,  // Keep existing fields like id, email, department
                name: teacherForm.name,
                subject: teacherForm.subject,
                phone: teacherForm.phone,
                position: teacherForm.position,
                joiningDate: teacherForm.joiningDate
              } 
            : t
        )
      );
      setTeacherForm({ 
        name: '', 
        subject: '', 
        phone: '', 
        position: '', 
        joiningDate: '' 
      });
      setEditingTeacher(null);
      setIsModalOpen(false);
    }
  };

  const handleDeleteTeacher = (id: number) => {
    setTeachers(teachers.filter((t) => t.id !== id));
  };

  const openEditModal = (teacher: Staff) => {
    setEditingTeacher(teacher);
    setTeacherForm({ 
      name: teacher.name, 
      subject: teacher.subject,
      phone: teacher.phone,
      position: teacher.position,
      joiningDate: teacher.joiningDate
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setTeacherForm({ 
      name: '', 
      subject: '',
      phone: '',
      position: '',
      joiningDate: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teachers List</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Add Teacher
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Subject</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{teacher.name}</td>
                <td className="px-6 py-4">{teacher.subject}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEditModal(teacher)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-4">Edit</button>
                  <button onClick={() => handleDeleteTeacher(teacher.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{editingTeacher ? 'Edit Teacher' : 'Add Teacher'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={teacherForm.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={teacherForm.subject}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={teacherForm.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
                <input
                  type="text"
                  name="position"
                  value={teacherForm.position}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Joining Date</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={teacherForm.joiningDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-4">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
              <button onClick={editingTeacher ? handleUpdateTeacher : handleAddTeacher} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{editingTeacher ? 'Update' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersList;
