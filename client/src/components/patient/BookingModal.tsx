// // src/components/patient/BookingModal.tsx
// import React, { useState, useEffect } from 'react';
// import { useAppDispatch, useAppSelector } from '@/app/hooks';
// import { getDoctorScheduleForPatient } from '@/features/appointments/appointmentThunk';
// import { bookAppointment } from '@/features/appointments/appointmentThunk';
// import { toast } from 'react-toastify';

// interface Doctor {
//   id: string;
//   name: string;
//   email: string;
//   specialization: { name: string; imageUrl: string };
//   experience: number;
//   languages: string[];
//   licensedState: string;
//   profileImage?: string;
//   consultationFee: number;
//   age?: number;
//   gender?: string;
// }

// interface TimeSlot {
//   id: string;
//   _id?: string;
//   startTime: string;
//   endTime: string;
//   isBooked: boolean;
//   isActive: boolean;
// }

// interface Schedule {
//   id: string;
//   _id?: string;
//   date: string;
//   timeSlots: TimeSlot[];
// }

// interface BookingModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   doctor: Doctor;
// }

// const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, doctor }) => {
//   const dispatch = useAppDispatch();
//   const { status } = useAppSelector((state) => state.appointments);
  
//   const [schedules, setSchedules] = useState<Schedule[]>([]);
//   const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
//   const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
//   const [reason, setReason] = useState('');
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (isOpen && doctor.id) {
//       loadDoctorSchedule();
//     }
//   }, [isOpen, doctor.id]);

//   const loadDoctorSchedule = async () => {
//     setLoading(true);
//     try {
//       const result = await dispatch(getDoctorScheduleForPatient(doctor.id));
//       if (result.payload) {
//         setSchedules(result.payload);
//       }
//     } catch (error) {
//       console.error('Error loading doctor schedule:', error);
//       toast.error('Failed to load available slots');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleScheduleSelect = (schedule: Schedule) => {
//     setSelectedSchedule(schedule);
//     setSelectedTimeSlot(null);
//   };

//   const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
//     setSelectedTimeSlot(timeSlot);
//   };

//   const handleBookAppointment = async () => {
//     if (!selectedSchedule || !selectedTimeSlot) {
//       toast.error('Please select a date and time slot');
//       return;
//     }

//     try {
//       const appointmentData = {
//         doctorId: doctor.id,
//         scheduleId: selectedSchedule.id || selectedSchedule._id!,
//         timeSlotId: selectedTimeSlot.id || selectedTimeSlot._id!,
//         reason: reason.trim() || undefined
//       };

//       await dispatch(bookAppointment(appointmentData)).unwrap();
//       toast.success('Appointment booked successfully!');
//       onClose();
//       resetForm();
//     } catch (error: any) {
//       console.error('Booking error:', error);
//       toast.error(error.message || 'Failed to book appointment');
//     }
//   };

//   const resetForm = () => {
//     setSelectedSchedule(null);
//     setSelectedTimeSlot(null);
//     setReason('');
//     setSchedules([]);
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const formatTime = (time: string) => {
//     return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: true
//     });
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//         <div className="p-6">
//           {/* Header */}
//           <div className="flex justify-between items-start mb-6">
//             <div className="flex items-center space-x-4">
//               <img
//                 src={doctor.profileImage || "https://via.placeholder.com/80"}
//                 alt={doctor.name}
//                 className="w-16 h-16 rounded-full object-cover"
//               />
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-800">Book Appointment</h2>
//                 <p className="text-lg text-gray-600">Dr. {doctor.name}</p>
//                 <p className="text-sm text-gray-500">{doctor.specialization?.name}</p>
//                 <p className="text-sm font-semibold text-blue-600">₹{doctor.consultationFee} per consultation</p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600 text-2xl"
//             >
//               ×
//             </button>
//           </div>

//           {loading ? (
//             <div className="flex justify-center items-center py-12">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//               <p className="ml-4 text-gray-600">Loading available slots...</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Date Selection */}
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Date</h3>
//                 {schedules.length === 0 ? (
//                   <div className="text-center py-8">
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                     </svg>
//                     <p className="text-gray-500 mt-2">No available slots</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-3 max-h-80 overflow-y-auto">
//                     {schedules.map((schedule) => (
//                       <button
//                         key={schedule.id || schedule._id}
//                         onClick={() => handleScheduleSelect(schedule)}
//                         className={`w-full p-4 text-left border rounded-lg transition-all ${
//                           selectedSchedule?.id === schedule.id || selectedSchedule?._id === schedule._id
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 hover:border-gray-300'
//                         }`}
//                       >
//                         <div className="font-medium text-gray-800">
//                           {formatDate(schedule.date)}
//                         </div>
//                         <div className="text-sm text-gray-600 mt-1">
//                           {schedule.timeSlots.length} slots available
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Time Slot Selection */}
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Time</h3>
//                 {!selectedSchedule ? (
//                   <div className="text-center py-8">
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     <p className="text-gray-500 mt-2">Please select a date first</p>
//                   </div>
//                 ) : (
//                   <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
//                     {selectedSchedule.timeSlots.map((timeSlot) => (
//                       <button
//                         key={timeSlot.id || timeSlot._id}
//                         onClick={() => handleTimeSlotSelect(timeSlot)}
//                         className={`p-3 text-center border rounded-lg transition-all ${
//                           selectedTimeSlot?.id === timeSlot.id || selectedTimeSlot?._id === timeSlot._id
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 hover:border-gray-300'
//                         }`}
//                       >
//                         <div className="font-medium text-gray-800">
//                           {formatTime(timeSlot.startTime)}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {formatTime(timeSlot.endTime)}
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Reason for Visit */}
//           <div className="mt-6">
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Reason for Visit (Optional)
//             </label>
//             <textarea
//               value={reason}
//               onChange={(e) => setReason(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               rows={3}
//               placeholder="Briefly describe your symptoms or reason for consultation..."
//             />
//           </div>

//           {/* Booking Summary */}
//           {selectedSchedule && selectedTimeSlot && (
//             <div className="mt-6 p-4 bg-gray-50 rounded-lg">
//               <h4 className="font-semibold text-gray-800 mb-2">Booking Summary</h4>
//               <div className="space-y-1 text-sm text-gray-600">
//                 <p><span className="font-medium">Doctor:</span> Dr. {doctor.name}</p>
//                 <p><span className="font-medium">Date:</span> {formatDate(selectedSchedule.date)}</p>
//                 <p><span className="font-medium">Time:</span> {formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}</p>
//                 <p><span className="font-medium">Fee:</span> ₹{doctor.consultationFee}</p>
//                 {reason && <p><span className="font-medium">Reason:</span> {reason}</p>}
//               </div>
//             </div>
//           )}

//           {/* Action Buttons */}
//           <div className="flex justify-end space-x-3 mt-6">
//             <button
//               onClick={onClose}
//               className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleBookAppointment}
//               disabled={!selectedSchedule || !selectedTimeSlot || status === 'loading'}
//               className={`px-6 py-2 rounded-lg transition-colors ${
//                 selectedSchedule && selectedTimeSlot && status !== 'loading'
//                   ? 'bg-blue-600 text-white hover:bg-blue-700'
//                   : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//               }`}
//             >
//               {status === 'loading' ? 'Booking...' : 'Book Appointment'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BookingModal;