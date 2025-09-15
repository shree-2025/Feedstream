import React from 'react';
import { Megaphone, Check, X } from 'lucide-react';
import Button from '../../components/ui/button/Button';
import { useModal } from '../../hooks/useModal';
import { Modal } from '../../components/ui/modal';

const Announcements: React.FC = () => {
  const { isOpen: isAnnouncementModalOpen, openModal: openAnnouncementModal, closeModal: closeAnnouncementModal } = useModal();

  const announcements = [
    { title: 'Mid-term Exams Schedule', content: 'The schedule for the upcoming mid-term exams has been posted...', date: '2023-10-25', author: 'Admin', status: 'Approved' },
    { title: 'Department Meeting', content: 'A mandatory meeting for all staff will be held on Friday.', date: '2023-10-24', author: 'Admin', status: 'Approved' },
    { title: 'Research Grant Proposal', content: 'A new research grant proposal is open for submission.', date: '2023-10-23', author: 'John Doe (Staff)', status: 'Pending' },
    { title: 'Holiday Notice', content: 'The department will be closed for the national holiday next Monday.', date: '2023-10-22', author: 'Admin', status: 'Approved' },
    { title: 'Lab Equipment Maintenance', content: 'The main lab will be closed for equipment maintenance this weekend.', date: '2023-10-21', author: 'Jane Smith (Staff)', status: 'Approved' },
  ];

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">{status}</span>;
      case 'Pending':
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">{status}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Modal isOpen={isAnnouncementModalOpen} onClose={closeAnnouncementModal} title="New Announcement">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
            <textarea rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={closeAnnouncementModal}>Cancel</Button>
            <Button>Post Announcement</Button>
          </div>
        </form>
      </Modal>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Announcements</h1>
        <Button onClick={openAnnouncementModal}>
          <Megaphone className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement, index) => (
          <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{announcement.title}</h3>
                  {getStatusChip(announcement.status)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{announcement.content}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Posted by {announcement.author} on {announcement.date}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {announcement.status === 'Pending' && (
                  <>
                    <Button variant="success" size="sm"><Check className="w-4 h-4 mr-1" />Approve</Button>
                    <Button variant="destructive" size="sm"><X className="w-4 h-4 mr-1" />Reject</Button>
                  </>
                )}
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
