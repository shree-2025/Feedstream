import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Button from '../../components/ui/button/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('staff-activity');
  const reportContentRef = useRef<HTMLDivElement>(null);

  const reportData = {
    'staff-activity': {
      title: 'Staff Activity Report',
      data: [
        { id: 1, name: 'Dr. Emily Carter', activities: 15, lastLogin: '2023-10-26' },
        { id: 2, name: 'John Doe', activities: 8, lastLogin: '2023-10-27' },
      ],
    },
    'student-logs': {
      title: 'Student Logs Report',
      data: [
        { id: 1, student: 'Alice Johnson', logs: 25, pending: 2 },
        { id: 2, student: 'Bob Williams', logs: 18, pending: 0 },
      ],
    },
  };

  const handleGenerateReport = () => {
    const input = reportContentRef.current;
    if (input) {
            html2canvas(input).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${reportType}-report.pdf`);
      });
    }
  };

  const renderReportContent = () => {
    const selectedReport = reportData[reportType as keyof typeof reportData];

    if (!selectedReport || !selectedReport.data || selectedReport.data.length === 0) {
      return <p>No data available for this report type.</p>;
    }

    const headers = Object.keys(selectedReport.data[0]);

    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">{selectedReport.title}</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header} className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedReport.data.map((row, index) => (
              <tr key={index}>
                {headers.map(header => (
                  <td key={header} className="px-6 py-4 whitespace-nowrap border-b border-gray-200 text-sm text-gray-900">
                    {row[header as keyof typeof row]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };


  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Generate Reports</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <Select
            value={reportType}
            onValueChange={(value) => setReportType(value)}
          >
            <SelectTrigger className="w-full sm:w-auto">
              <SelectValue placeholder="Select a report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="staff-activity">Staff Activity</SelectItem>
              <SelectItem value="student-logs">Student Logs</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateReport}>Generate Report</Button>
        </div>
      </div>

      {/* Hidden div for rendering report content for PDF generation */}
      <div className="absolute -left-full top-0">
          <div ref={reportContentRef} className="p-6 bg-white w-[800px]">
              {renderReportContent()}
          </div>
      </div>
    </div>
  );
};

export default Reports;
