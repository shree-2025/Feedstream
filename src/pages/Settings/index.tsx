import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-4 sm:p-6 xl:p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Theme Settings</h2>
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400">
              Current theme: <span className="font-medium capitalize">{theme}</span>
            </p>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
