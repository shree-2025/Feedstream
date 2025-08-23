import React, { useState } from 'react';

const teachers = [
  { id: 1, name: 'Dr. Emily Carter' },
  { id: 2, name: 'Mr. John Doe' },
  { id: 3, name: 'Ms. Jane Smith' },
];

const subjects = [
  { id: 1, name: 'Computer Science' },
  { id: 2, name: 'Mathematics' },
  { id: 3, name: 'Physics' },
];

const questions = [
  { id: 1, text: 'How would you rate the clarity of the lectures?' },
  { id: 2, text: 'Was the course material relevant and useful?' },
  { id: 3, text: 'How helpful were the assignments in understanding the subject?' },
  { id: 4, text: 'Rate the availability of the teacher for doubts and discussions.' },
];

const CreateFeedbackForm: React.FC = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleGenerateLink = () => {
    if (selectedTeacher && selectedSubject && selectedQuestions.length > 0 && startDate && endDate) {
      const formLink = `https://example.com/feedback?teacher=${selectedTeacher}&subject=${selectedSubject}&questions=${selectedQuestions.join(',')}&start=${startDate}&end=${endDate}`;
      alert(`Feedback form link generated:\n${formLink}`);
    } else {
      alert('Please fill out all fields before generating the link.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create Feedback Form</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-6">
        
        <div>
          <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Teacher</label>
          <select id="teacher" value={selectedTeacher} onChange={(e) => setSelectedTeacher(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="" disabled>Choose a teacher</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Subject</label>
          <select id="subject" value={selectedSubject} onChange={(e) => setSelectedSubject(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="" disabled>Choose a subject</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Questions</label>
          <div className="space-y-2">
            {questions.map(q => (
              <div key={q.id} className="flex items-center">
                <input 
                  type="checkbox" 
                  id={`q-${q.id}`} 
                  value={q.id} 
                  checked={selectedQuestions.includes(q.id)} 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedQuestions([...selectedQuestions, q.id]);
                    } else {
                      setSelectedQuestions(selectedQuestions.filter(id => id !== q.id));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`q-${q.id}`} className="ml-3 text-sm text-gray-700 dark:text-gray-300">{q.text}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
            <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
        </div>

        <div className="text-right">
          <button onClick={handleGenerateLink} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Generate Link</button>
        </div>

      </div>
    </div>
  );
};

export default CreateFeedbackForm;
