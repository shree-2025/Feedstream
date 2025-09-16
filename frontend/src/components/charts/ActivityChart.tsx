import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', staff: 3, students: 15 },
  { name: 'Tue', staff: 5, students: 25 },
  { name: 'Wed', staff: 8, students: 30 },
  { name: 'Thu', staff: 4, students: 22 },
  { name: 'Fri', staff: 6, students: 28 },
  { name: 'Sat', staff: 2, students: 10 },
];

const ActivityChart: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Weekly Activity</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="staff" fill="#8884d8" name="Staff Activity" />
          <Bar dataKey="students" fill="#82ca9d" name="Student Activity" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityChart;
