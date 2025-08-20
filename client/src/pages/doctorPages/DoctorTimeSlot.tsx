import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { createTimeSlot, cancelTimeSlot, getTimeSlots } from "@/features/Doctor/TimeSlotThunk";
import { toast } from "react-toastify";
import DoctorNavbar from "@/components/doctor/DoctorNavbar";

const generateTimeSlots = () => {
  const slots = [];
  const startHour = 9; 
  const endHour = 18; 
  
  for (let hour = startHour; hour < endHour; hour++) {
    
    slots.push({
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${hour.toString().padStart(2, '0')}:30`
    });
    slots.push({
      startTime: `${hour.toString().padStart(2, '0')}:30`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
    });
  }
  
  return slots;
};


const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};


const isPastDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};


const isPastTimeSlot = (startTime: string, date: Date) => {
  if (!isToday(date)) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const [slotHour, slotMinute] = startTime.split(':').map(Number);
  
  // If slot hour is less than current hour, it's in the past
  if (slotHour < currentHour) return true;
  
  // If slot hour equals current hour, check minutes
  if (slotHour === currentHour && slotMinute <= currentMinute) return true;
  
  return false;
};

const DoctorTimeSlot: React.FC = () => {
  const dispatch = useAppDispatch();
  const { timeSlots, status, error } = useAppSelector((state) => state.doctors);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayedDate, setDisplayedDate] = useState<Date | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  
  const availableTimeSlots = generateTimeSlots();

  useEffect(() => {
    dispatch(getTimeSlots());
  }, [dispatch]);

  // Get existing time slots for the selected date
  const getExistingTimeSlotsForDate = (date: Date) => {
    const dateString = date.toDateString();
    return timeSlots.filter(slot => new Date(slot.date).toDateString() === dateString);
  };

  const handleTimeSlotToggle = (slotKey: string) => {
    setSelectedTimeSlots(prev => {
      if (prev.includes(slotKey)) {
        return prev.filter(slot => slot !== slotKey);
      } else {
        return [...prev, slotKey];
      }
    });
  };

  const isTimeSlotAlreadyExists = (startTime: string, endTime: string) => {
    const existingSlots = getExistingTimeSlotsForDate(selectedDate);
    return existingSlots.some(slot => 
      slot.startTime === startTime && slot.endTime === endTime
    );
  };

  const handleCreateTimeSlots = () => {
    if (selectedTimeSlots.length === 0) {
      toast.error("Please select at least one time slot");
      return;
    }

    // Validate date is not in the past
    if (isPastDate(selectedDate)) {
      toast.error("Cannot create time slots for past dates");
      return;
    }

    // Additional validation for time slots if it's today
    if (isToday(selectedDate)) {
      const invalidSlots = selectedTimeSlots.filter(slotKey => {
        const startTime = slotKey.split('-')[0];
        return isPastTimeSlot(startTime, selectedDate);
      });

      if (invalidSlots.length > 0) {
        toast.error("Cannot create time slots for past hours on today's date");
        return;
      }
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const timeSlotsToCreate = selectedTimeSlots.map(slotKey => {
      const slot = availableTimeSlots.find(s => `${s.startTime}-${s.endTime}` === slotKey);
      return {
        startTime: slot!.startTime,
        endTime: slot!.endTime
      };
    });

    dispatch(createTimeSlot({ 
      date: dateString, 
      timeSlots: timeSlotsToCreate 
    }))
      .unwrap()
      .then(() => {
        toast.success("Time slots created successfully");
        setSelectedTimeSlots([]);
        dispatch(getTimeSlots());
      })
      .catch((err) => toast.error(err.message || "Failed to create time slots"));
  };

  const handleCancelTimeSlot = (timeSlotId: string, scheduleId: string, isBooked: boolean) => {
    if (isBooked) {
      toast.error("Cannot cancel a booked time slot");
      return;
    }
    if (window.confirm("Are you sure you want to cancel this time slot?")) {
      dispatch(cancelTimeSlot({ scheduleId, timeSlotId }))
        .unwrap()
        .then(() => {
          toast.success("Time slot canceled successfully");
          dispatch(getTimeSlots());
        })
        .catch((err) => toast.error(err.message || "Failed to cancel time slot"));
    }
  };

  const uniqueDates = [...new Set(timeSlots.map(slot => new Date(slot.date).toDateString()))]
    .map(dateStr => new Date(dateStr));

  const handleDateClick = (date: Date) => {
    setDisplayedDate(displayedDate?.toDateString() === date.toDateString() ? null : date);
  };

  if (status === "loading") return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">Loading time slots...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Time Slots</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => dispatch(getTimeSlots())}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <>
      <DoctorNavbar/>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Date</h2>
                  <Calendar 
                    onChange={(date) => {
                      const selectedDate = date as Date;
                      
                      // Prevent selecting past dates
                      if (isPastDate(selectedDate)) {
                        toast.error("Cannot select past dates");
                        return;
                      }
                      
                      setSelectedDate(selectedDate);
                      setSelectedTimeSlots([]); // Clear selected slots when date changes
                    }} 
                    value={selectedDate}
                    className="border-0 rounded-xl overflow-hidden"
                    minDate={new Date()} // Disable past dates in calendar
                    tileClassName={({ date, view }) => {
                      let baseClasses = 'rounded-lg border-2 border-transparent hover:border-blue-300 transition-all';
                      
                      // Disable past dates visually
                      if (isPastDate(date)) {
                        baseClasses += ' !bg-gray-200 !text-gray-400 cursor-not-allowed';
                        return baseClasses;
                      }
                      
                      if (date.toDateString() === new Date().toDateString()) {
                        baseClasses += ' bg-blue-100 font-bold text-blue-800';
                      }
                      
                      if (date.toDateString() === selectedDate.toDateString()) {
                        baseClasses += ' bg-blue-500 text-white font-bold border-blue-600';
                      }
                      
                      if (view === 'month' && uniqueDates.some(d => d.toDateString() === date.toDateString())) {
                        baseClasses += ' bg-indigo-50 text-indigo-700';
                      }
                      
                      return baseClasses;
                    }}
                    tileDisabled={({ date }) => isPastDate(date)}
                    navigationLabel={({ date, label, locale, view }) => (
                      <span className="text-lg font-bold text-gray-800">
                        {label}
                      </span>
                    )}
                    formatShortWeekday={(locale, date) => 
                      ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]
                    }
                    tileContent={({ date, view }) => {
                      if (view === 'month' && uniqueDates.some(d => d.toDateString() === date.toDateString())) {
                        return (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Select Time Slots for {selectedDate.toLocaleDateString()}
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {availableTimeSlots.map((slot) => {
                      const slotKey = `${slot.startTime}-${slot.endTime}`;
                      const isSelected = selectedTimeSlots.includes(slotKey);
                      const alreadyExists = isTimeSlotAlreadyExists(slot.startTime, slot.endTime);
                      const isPastSlot = isPastTimeSlot(slot.startTime, selectedDate);
                      const isDisabled = alreadyExists || isPastSlot;
                      
                      let buttonClass = 'p-3 rounded-lg text-sm font-medium transition-all duration-200 ';
                      let statusText = '';
                      
                      if (isPastSlot) {
                        buttonClass += 'bg-red-100 text-red-500 cursor-not-allowed';
                        statusText = 'Past time';
                      } else if (alreadyExists) {
                        buttonClass += 'bg-gray-300 text-gray-500 cursor-not-allowed';
                        statusText = 'Already exists';
                      } else if (isSelected) {
                        buttonClass += 'bg-blue-500 text-white shadow-md transform scale-105';
                      } else {
                        buttonClass += 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300 hover:bg-blue-50';
                      }
                      
                      return (
                        <button
                          key={slotKey}
                          onClick={() => !isDisabled && handleTimeSlotToggle(slotKey)}
                          disabled={isDisabled}
                          className={buttonClass}
                        >
                          {slot.startTime} - {slot.endTime}
                          {statusText && (
                            <div className="text-xs mt-1">{statusText}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Current time indicator for today */}
                  {isToday(selectedDate) && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center text-sm text-yellow-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Current time: {new Date().toLocaleTimeString('en-US', { 
                          hour12: false, 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} - Past time slots are disabled
                      </div>
                    </div>
                  )}

                  {selectedTimeSlots.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 mb-2">
                        Selected {selectedTimeSlots.length} time slot(s):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTimeSlots.map((slotKey) => (
                          <span
                            key={slotKey}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {slotKey.replace('-', ' - ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCreateTimeSlots}
                    disabled={selectedTimeSlots.length === 0}
                    className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-colors shadow-sm ${
                      selectedTimeSlots.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Create Selected Time Slots ({selectedTimeSlots.length})
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Availability</h2>
                
                {uniqueDates.length === 0 ? (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-600">No time slots available</h3>
                    <p className="mt-1 text-gray-500">Select your first time slots using the form on the left</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {uniqueDates.map((date) => (
                        <div
                          key={date.toDateString()}
                          className={`border rounded-lg overflow-hidden transition-all ${displayedDate?.toDateString() === date.toDateString() ? 'border-blue-300 shadow-md' : 'border-gray-200'}`}
                        >
                          <div 
                            className="flex justify-between items-center p-3 bg-white cursor-pointer hover:bg-gray-50"
                            onClick={() => handleDateClick(date)}
                          >
                            <div className="flex items-center">
                              <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-3 font-medium">
                                {date.getDate()}
                              </span>
                              <span className="font-medium text-gray-800">
                                {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-gray-500 mr-2">
                                {timeSlots.filter(slot => new Date(slot.date).toDateString() === date.toDateString()).length} slots
                              </span>
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-5 w-5 text-gray-500 transition-transform ${displayedDate?.toDateString() === date.toDateString() ? 'transform rotate-180' : ''}`} 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                              >
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          
                          {displayedDate?.toDateString() === date.toDateString() && (
                            <div className="bg-gray-50 p-3 border-t border-gray-200">
                              <ul className="space-y-2">
                                {timeSlots
                                  .filter(slot => new Date(slot.date).toDateString() === date.toDateString())
                                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                  .map((slot) => (
                                    <li
                                      key={slot.id}
                                      className="flex justify-between items-center bg-white p-3 rounded border border-gray-200"
                                    >
                                      <div className="flex items-center">
                                        <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center mr-3 font-medium ${
                                          slot.isBooked 
                                            ? 'bg-purple-100 text-purple-800' 
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </span>
                                        <span className="font-medium">
                                          {slot.startTime} - {slot.endTime}
                                        </span>
                                        {slot.isBooked && (
                                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">
                                            Booked
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancelTimeSlot(slot.id, slot.scheduleId, slot.isBooked);
                                        }}
                                        disabled={slot.isBooked}
                                        className={`px-3 py-1 rounded-lg font-medium text-sm ${slot.isBooked 
                                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                          : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                      >
                                        Cancel
                                      </button>
                                    </li>
                                  ))}
                              </ul>
                              
                              {timeSlots.filter(slot => new Date(slot.date).toDateString() === date.toDateString()).length === 0 && (
                                <div className="text-center py-4 text-gray-500">
                                  No time slots for this date
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorTimeSlot;