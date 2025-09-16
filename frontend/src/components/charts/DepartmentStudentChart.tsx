import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Row = { name: string; [k: string]: string | number };

type Props = {
  data: Row[];
  title?: string;
  valueKey?: string; // which numeric field to chart, defaults to 'studentCount'
  barLabel?: string; // legend label
};

const DepartmentStudentChart: React.FC<Props> = ({ data, title = 'Student Distribution by Department', valueKey = 'studentCount', barLabel = 'Number of Students' }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="name"
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
            className="text-xs text-gray-600 dark:text-gray-400"
          />
          <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid #ccc',
              color: '#333',
            }}
            labelClassName="font-bold"
          />
          <Legend />
          <Bar dataKey={valueKey} fill="#8884d8" name={barLabel} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DepartmentStudentChart;
