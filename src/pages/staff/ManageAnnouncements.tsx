import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/ui/button/Button';
import { useModal } from '../../hooks/useModal';
import { Modal } from '../../components/ui/modal';

// Mock data for announcements
const mockAnnouncements = [
  { id: 1, title: 'Upcoming System Maintenance', content: 'The system will be down for maintenance on Friday at 10 PM.', date: '2024-02-20' },
  { id: 2, title: 'New Feature: Staff Activity Submission', content: 'Staff can now submit their activities for approval directly through the dashboard.', date: '2024-02-18' },
  { id: 3, title: 'Holiday Schedule Announcement', content: 'The office will be closed on Monday for the public holiday.', date: '2024-02-15' },
];

const ManageAnnouncements: React.FC = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<{ id?: number; title: string; content: string } | null>(null);

  const handleCreate = () => {
    setCurrentAnnouncement({ title: '', content: '' });
    openModal();
  };

  const handleEdit = (announcement: typeof mockAnnouncements[0]) => {
    setCurrentAnnouncement(announcement);
    openModal();
  };

  const handleDelete = (id: number) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  const handleSave = () => {
    if (!currentAnnouncement) return;

    if (currentAnnouncement.id) {
      // Update existing announcement
      setAnnouncements(announcements.map(a => 
        a.id === currentAnnouncement.id 
          ? { ...a, title: currentAnnouncement.title, content: currentAnnouncement.content } 
          : a
      ));
    } else {
      // Add new announcement
      const newAnnouncement = {
        id: Date.now(), // Use timestamp for unique ID in mock data
        title: currentAnnouncement.title,
        content: currentAnnouncement.content,
        date: new Date().toISOString().split('T')[0], // Format date as YYYY-MM-DD
      };
      setAnnouncements([newAnnouncement, ...announcements]);
    }
    closeModal();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (currentAnnouncement) {
      setCurrentAnnouncement({
        ...currentAnnouncement,
        [e.target.name]: e.target.value,
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Announcements</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create, edit, and delete announcements for students.</p>
        </div>
        <Button onClick={handleCreate} startIcon={<Plus className="w-4 h-4" />}>
          Create Announcement
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Title</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement) => (
                <tr key={announcement.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {announcement.title}
                  </th>
                  <td className="px-6 py-4">{announcement.date}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(announcement)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(announcement.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isOpen && (
        <Modal isOpen={isOpen} title={currentAnnouncement?.id ? 'Edit Announcement' : 'Create Announcement'} onClose={closeModal}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <input
                type="text"
                value={currentAnnouncement?.title || ''}
                name="title"
                onChange={handleFormChange}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
              <textarea
                rows={4}
                value={currentAnnouncement?.content || ''}
                name="content"
                onChange={handleFormChange}
                className="input-field mt-1"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageAnnouncements;
