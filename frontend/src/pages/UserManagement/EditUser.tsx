import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUsers } from '../../context/UserContext';

const EditUser: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { getUserById, updateUser } = useUsers();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', email: '', role: '' });

  useEffect(() => {
    if (userId) {
      const user = getUserById(userId);
      if (user) {
        setFormData({ name: user.name, email: user.email, role: user.role });
      } else {
        alert('User not found!');
        navigate('/admin/users');
      }
    }
  }, [userId, getUserById, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId) {
      updateUser(userId, formData);
      alert('User updated successfully!');
      navigate('/admin/users');
    }
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit User</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option>Admin</option>
                <option>User</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
