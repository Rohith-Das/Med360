import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { createTimeSlot, cancelTimeSlot, getTimeSlots } from "@/features/Doctor/TimeSlotThunk";
import { toast } from "react-toastify";
import DoctorNavbar from "@/components/doctor/DoctorNavbar";

const DoctorTimeSlot: React.FC = () => {
  const dispatch = useAppDispatch();
  const { timeSlots, status, error } = useAppSelector((state) => state.doctors);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayedDate, setDisplayedDate] = useState<Date | null>(null);
  const [timeSlotsInput, setTimeSlotsInput] = useState<{ startTime: string; endTime: string }[]>([{ startTime: "", endTime: "" }]);

  useEffect(() => {
    dispatch(getTimeSlots());
  }, [dispatch]);

  const handleCreateTimeSlot = () => {
    const validTimeSlots = timeSlotsInput.filter(slot => slot.startTime && slot.endTime);
    if (validTimeSlots.length === 0) {
      toast.error("At least one time slot is required");
      return;
    }
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
  
    dispatch(createTimeSlot({ 
      date: dateString, 
      timeSlots: validTimeSlots 
    }))
      .unwrap()
      .then(() => {
        toast.success("Time slots created successfully");
        setTimeSlotsInput([{ startTime: "", endTime: "" }]);
        dispatch(getTimeSlots());
      })
      .catch((err) => toast.error(err.message || "Failed to create time slots"));
  };

  const handleCancelTimeSlot=(timeSlotId:string,scheduleId:string,isBooked:boolean)=>{
    if(isBooked){
      toast.error("can not cancel a booked time slot")
      return
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
  }

  const handleAddTimeSlot = () => {
    setTimeSlotsInput([...timeSlotsInput, { startTime: "", endTime: "" }]);
  };

  const handleTimeSlotChange = (index: number, field: string, value: string) => {
    const newTimeSlots = [...timeSlotsInput];
    newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };
    setTimeSlotsInput(newTimeSlots);
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
         
      
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Date</h2>
                <Calendar 
                  onChange={(date) => setSelectedDate(date as Date)} 
                  value={selectedDate}
                  className="border-0 rounded-xl overflow-hidden"
                  tileClassName={({ date, view }) => {
                    let baseClasses = 'rounded-lg border-2 border-transparent hover:border-blue-300 transition-all';
                    
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
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Time Slots</h2>
                <div className="space-y-4">
                  {timeSlotsInput.map((slot, index) => (
                    <div key={index} className="flex space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          type="text"
                          placeholder="HH:MM (e.g., 09:00)"
                          value={slot.startTime}
                          onChange={(e) => handleTimeSlotChange(index, "startTime", e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                          type="text"
                          placeholder="HH:MM (e.g., 10:00)"
                          value={slot.endTime}
                          onChange={(e) => handleTimeSlotChange(index, "endTime", e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleAddTimeSlot}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Add Another Time Slot
                  </button>
                  <button
                    onClick={handleCreateTimeSlot}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors shadow-sm"
                  >
                    Create Time Slots
                  </button>
                </div>
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
                  <p className="mt-1 text-gray-500">Add your first time slot using the form on the left</p>
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
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 text-gray-500 transition-transform ${displayedDate?.toDateString() === date.toDateString() ? 'transform rotate-180' : ''}`} 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
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
                                      <span className="inline-block w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center mr-3 font-medium">
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
                                        handleCancelTimeSlot(slot.id, slot.scheduleId,slot.isBooked);
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
 
    </>
  );
};

export default DoctorTimeSlot;