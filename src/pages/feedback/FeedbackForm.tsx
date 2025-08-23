import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// Mock data - in a real app, this would come from an API
const allTeachers = [
  { id: 1, name: 'Dr. Emily Carter' },
  { id: 2, name: 'Mr. John Doe' },
  { id: 3, name: 'Ms. Jane Smith' },
];

const allSubjects = [
  { id: 1, name: 'Computer Science' },
  { id: 2, name: 'Mathematics' },
  { id: 3, name: 'Physics' },
];

const allQuestions = [
  { id: 1, text: 'How would you rate the clarity of the lectures?' },
  { id: 2, text: 'Was the course material relevant and useful?' },
  { id: 3, text: 'How helpful were the assignments in understanding the subject?' },
  { id: 4, text: 'Rate the availability of the teacher for doubts and discussions.' },
];

const FeedbackForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [feedbackData, setFeedbackData] = useState<any>({});
  const [formDetails, setFormDetails] = useState<any>(null);

  useEffect(() => {
    const teacherId = searchParams.get('teacher');
    const subjectId = searchParams.get('subject');
    const questionIds = searchParams.get('questions')?.split(',').map(Number) || [];

    const teacher = allTeachers.find(t => t.id === Number(teacherId));
    const subject = allSubjects.find(s => s.id === Number(subjectId));
    const questions = allQuestions.filter(q => questionIds.includes(q.id));

    setFormDetails({ teacher, subject, questions });
  }, [searchParams]);

  const handleInputChange = (questionId: number, value: string) => {
    setFeedbackData({ ...feedbackData, [questionId]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Feedback Submitted:', feedbackData);
    alert('Thank you for your feedback!');
  };

  if (!formDetails || !formDetails.teacher || !formDetails.subject) {
    return <div className="text-center p-6">Loading form or invalid link...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">Feedback Form</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          For <strong>{formDetails.teacher.name}</strong> on the subject of <strong>{formDetails.subject.name}</strong>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {formDetails.questions.map((q: any) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{q.text}</label>
              <input 
                type="text" 
                onChange={(e) => handleInputChange(q.id, e.target.value)}
                placeholder="Your answer"
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          ))}
          
          <div className="text-center pt-4">
            <button type="submit" className="px-8 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Submit Feedback</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
