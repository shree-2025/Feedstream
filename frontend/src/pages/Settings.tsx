import React from 'react';
import Button from '../components/ui/button/Button';
import { User, Shield, Bell } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <User className="w-8 h-8 mr-4 text-brand-500" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Update your personal information, profile picture, and contact details.
          </p>
          <Button variant="outline">Edit Profile</Button>
        </div>

        {/* Security Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 mr-4 text-brand-500" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Security</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Change your password, set up two-factor authentication, and manage your sessions.
          </p>
          <Button variant="outline">Manage Security</Button>
        </div>

        {/* Notification Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Bell className="w-8 h-8 mr-4 text-brand-500" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Choose how you receive notifications about your account and activity.
          </p>
          <Button variant="outline">Manage Notifications</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
