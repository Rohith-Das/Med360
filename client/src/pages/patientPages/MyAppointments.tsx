// src/pages/patientPages/MyAppointments.tsx
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getMyAppointments, cancelAppointment } from '@/features/appointments/appointmentThunk';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '@/components/patient/Navbar';

interface Appointment {
  id: string;
  _id?: string;
  patientId: any;
  doctorId: any;
  scheduleId: string;
  timeSlotId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  consultationFee: number;
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  cancelledBy?: 'patient' | 'doctor';
  cancellationReason?: string;
}

const MyAppointments: React.FC = () => {
  const dispatch = useAppDispatch();
  const { appointments, status, error } = useAppSelector((state) => state.appointments);
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [cancellingAppointment, setCancellingAppointment] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [dispatch]);

  const loadAppointments = () => {
    const statusFilter = filterStatus === 'all' ? undefined : [filterStatus];
    dispatch(getMyAppointments(statusFilter));
  };

  useEffect(() => {
    loadAppointments();
  }, [filterStatus]);

  const handleCancelClick = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setShowCancelModal(true);
    setCancellationReason('');
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;

    setCancellingAppointment(appointmentToCancel.id);
    try {
      await dispatch(cancelAppointment({
        appointmentId: appointmentToCancel.id,
        cancellationReason: cancellationReason.trim() || undefined
      })).unwrap();
      
      toast.success('Appointment cancelled successfully');
      setShowCancelModal(false);
      setAppointmentToCancel(null);
      setCancellationReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel appointment');
    } finally {
      setCancellingAppointment(null);
    }
  };

  const canCancelAppointment = (appointment: Appointment) => {
    if (appointment.status !== 'scheduled') return false;
    
    const appointmentDateTime = new Date(appointment.appointmentDate);
    const [hours, minutes] = appointment.startTime.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    return appointmentDateTime > oneHourFromNow;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAppointments = appointments.filter(appointment => 
    filterStatus === 'all' || appointment.status === filterStatus
  );

  if (status === 'loading') {
    return (
      <div className="">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-gray-600">Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Appointments</h1>
            <p className="text-gray-600">Manage your upcoming and past appointments</p>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'all', label: 'All Appointments', count: appointments.length },
                  { id: 'scheduled', label: 'Scheduled', count: appointments.filter(a => a.status === 'scheduled').length },
                  { id: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length },
                  { id: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      filterStatus === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                        filterStatus === tab.id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Appointments List */}
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filterStatus === 'all' 
                  ? "You haven't booked any appointments yet." 
                  : `No ${filterStatus} appointments found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Doctor Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={appointment.doctorId?.profileImage || "https://via.placeholder.com/60"}
                          alt={appointment.doctorId?.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </div>
                      
                      {/* Appointment Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Dr. {appointment.doctorId?.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          {appointment.doctorId?.specialization?.name || 'Specialization not available'}
                        </p>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(appointment.appointmentDate)}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>₹{appointment.consultationFee}</span>
                          </div>
                          
                          {appointment.reason && (
                            <div className="flex items-start mt-2">
                              <svg className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm italic">{appointment.reason}</span>
                            </div>
                          )}
                          
                          {appointment.cancellationReason && appointment.status === 'cancelled' && (
                            <div className="flex items-start mt-2 text-red-600">
                              <svg className="w-4 h-4 mr-2 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <div>
                                <span className="text-sm font-medium">Cancelled by {appointment.cancelledBy}</span>
                                <p className="text-sm">{appointment.cancellationReason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      {appointment.status === 'scheduled' && (
                        <>
                          <button className="px-4 py-2 text-sm border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-colors duration-200">
                            Join Consultation
                          </button>
                          {canCancelAppointment(appointment) && (
                            <button
                              onClick={() => handleCancelClick(appointment)}
                              disabled={cancellingAppointment === appointment.id}
                              className="px-4 py-2 text-sm border border-red-500 text-red-600 rounded-md hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {cancellingAppointment === appointment.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </>
                      )}
                      
                      {appointment.status === 'completed' && (
                        <button className="px-4 py-2 text-sm border border-green-500 text-green-600 rounded-md hover:bg-green-50 transition-colors duration-200">
                          View Report
                        </button>
                      )}
                      
                      <button className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors duration-200">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Appointment Modal */}
      {showCancelModal && appointmentToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Appointment</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to cancel your appointment with Dr. {appointmentToCancel.doctorId?.name} on {formatDate(appointmentToCancel.appointmentDate)} at {formatTime(appointmentToCancel.startTime)}?
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (Optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Please provide a reason for cancelling this appointment..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setAppointmentToCancel(null);
                  setCancellationReason('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingAppointment !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingAppointment ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer />
    </div>
  );
};

export default MyAppointments;