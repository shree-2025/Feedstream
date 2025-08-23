import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
  placeholder?: string;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate = null,
  maxDate = null,
  placeholder = 'Select date',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState('');
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Format date for display (e.g., "Aug 18, 2023")
  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle click outside to close the calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update display date when value changes
  useEffect(() => {
    setDisplayDate(formatDisplayDate(value));
  }, [value]);

  // Generate days for the calendar
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number, month: number, year: number) => {
    const selectedDate = new Date(year, month, day);
    onChange(selectedDate);
    setIsOpen(false);
  };

  const today = new Date();
  const currentYear = value?.getFullYear() || today.getFullYear();
  const currentMonth = value?.getMonth() || today.getMonth();
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  
  const days = [];
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  
  // Previous month's days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      month: currentMonth - 1,
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      isCurrentMonth: false,
    });
  }
  
  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDate = new Date(currentYear, currentMonth, i);
    const isDisabled = 
      (minDate && dayDate < new Date(minDate.setHours(0, 0, 0, 0))) ||
      (maxDate && dayDate > new Date(maxDate.setHours(23, 59, 59, 999)));
    
    days.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
      isDisabled,
      isSelected: value ? 
        i === value.getDate() && 
        currentMonth === value.getMonth() && 
        currentYear === value.getFullYear() : false,
    });
  }
  
  // Next month's days
  const remainingDays = 42 - days.length; // 6 rows x 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      month: currentMonth + 1,
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
      isCurrentMonth: false,
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const goToPreviousMonth = () => {
    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    // Update the selected date to the first day of the previous month
    const newDate = new Date(newYear, newMonth, 1);
    if (!minDate || newDate >= new Date(minDate.setHours(0, 0, 0, 0))) {
      onChange(newDate);
    }
  };

  const goToNextMonth = () => {
    const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    // Update the selected date to the first day of the next month
    const newDate = new Date(newYear, newMonth, 1);
    if (!maxDate || newDate <= new Date(maxDate.setHours(23, 59, 59, 999))) {
      onChange(newDate);
    }
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className={`relative ${className}`} ref={datePickerRef}>
      <div
        className={`flex items-center justify-between w-full px-3 py-2 border rounded-md cursor-pointer ${
          isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
        } bg-white dark:bg-gray-700`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`${!value ? 'text-gray-400 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {value ? displayDate : placeholder}
        </span>
        <div className="flex items-center">
          {value && (
            <button
              type="button"
              onClick={clearDate}
              className="p-1 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <CalendarIcon className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-64 p-4 mt-1 bg-white border rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={minDate ? new Date(currentYear, currentMonth - 1, 1) < new Date(new Date(minDate).setHours(0, 0, 0, 0)) : false}
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={maxDate ? new Date(currentYear, currentMonth + 1, 1) > new Date(new Date(maxDate).setHours(23, 59, 59, 999)) : false}
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-xs font-medium text-center text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((dayData, index) => (
              <button
                key={index}
                type="button"
                className={`flex items-center justify-center w-8 h-8 text-sm rounded-full ${
                  dayData.isSelected
                    ? 'bg-blue-600 text-white'
                    : dayData.isCurrentMonth
                    ? 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'text-gray-400 dark:text-gray-500'
                } ${dayData.isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() =>
                  !dayData.isDisabled &&
                  dayData.isCurrentMonth &&
                  handleDateSelect(dayData.day, dayData.month, dayData.year)
                }
                disabled={dayData.isDisabled || !dayData.isCurrentMonth}
              >
                {dayData.day}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                onChange(today);
                setIsOpen(false);
              }}
              className="px-3 py-1 text-sm text-blue-600 rounded-md hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="px-3 py-1 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
