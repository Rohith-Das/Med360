import React from 'react';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  availableDates: Date[];
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, availableDates }) => {
  const today = new Date();
  const weekStart = startOfWeek(today);
  const days = [];

  // Generate 14 days (2 weeks) starting from today
  for (let i = 0; i < 14; i++) {
    days.push(addDays(weekStart, i));
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const isAvailable = availableDates.some(date => isSameDay(date, day));
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        
        return (
          <button
            key={day.toString()}
            onClick={() => isAvailable && onDateSelect(day)}
            className={`p-2 rounded-md text-center ${
              isSelected
                ? 'bg-blue-500 text-white'
                : isAvailable
                ? 'bg-white hover:bg-gray-100'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAvailable}
          >
            <div className="text-sm font-medium">{format(day, 'EEE')}</div>
            <div className="text-lg">{format(day, 'd')}</div>
          </button>
        );
      })}
    </div>
  );
};

export default Calendar;