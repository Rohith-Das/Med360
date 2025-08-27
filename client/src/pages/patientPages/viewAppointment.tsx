import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/patient/Navbar';
import { toast, ToastContainer } from 'react-toastify';
import axiosInstance from '../../api/axiosInstance';

interface AppointmentData {
  _id: string;
  doctorId: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  consultationFee: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  doctor?: {
    name: string;
    specialization: { name: string };
    profileImage?: string;
  };
}

const ViewAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axiosInstance.get('/patient/appointments');
      setAppointments(res.data.data);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch appointments');
      setLoading(false);
    }
  };

  // New function to refresh wallet data and transactions
  const refreshWalletData = async () => {
    try {
      const walletResponse = await axiosInstance.get('/patient/wallet/balance');
      if (walletResponse.data.success) {
        // Assuming wallet data is stored in localStorage or context for WalletPage
        localStorage.setItem('walletData', JSON.stringify(walletResponse.data.data));
      }

      const transactionResponse = await axiosInstance.get('/patient/wallet/transactions');
      if (transactionResponse.data.success) {
        localStorage.setItem('transactionData', JSON.stringify(transactionResponse.data.data));
      }
    } catch (error: any) {
      console.error('Error refreshing wallet data:', error);
      toast.error(error.response?.data?.message || 'Failed to refresh wallet data');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'refunded':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const canCancelAppointment = (appointment: AppointmentData) => {
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return false;
    }
    return true; // Simplified for clarity; add time-based logic if needed
  };

  const getTimeUntilAppointment = (appointment: AppointmentData) => {
    const appointmentDateTime = new Date(`${appointment.date} ${appointment.startTime}`);
    const now = new Date();
    const timeDifference = appointmentDateTime.getTime() - now.getTime();
    
    if (timeDifference <= 0) return 'Past appointment';
    
    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }
    
    return `${hours}h ${minutes}m remaining`;
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!appointmentId) return;
    
    setCancellingId(appointmentId);
    
    try {
      const response = await axiosInstance.put(`/patient/appointments/${appointmentId}/cancel`, {
        reason: cancelReason || 'Cancelled by patient'
      });

      if (response.data.success) {
        toast.success(response.data.message);
        
        // Update the appointment in the local state
        setAppointments(prev => 
          prev.map(apt => 
            apt._id === appointmentId 
              ? { 
                  ...apt, 
                  status: 'cancelled', 
                  paymentStatus: response.data.data.refunded ? 'refunded' : apt.paymentStatus 
                }
              : apt
          )
        );
        
        // Show additional success message if refunded
        if (response.data.data.refunded) {
          toast.success(`₹${response.data.data.refundAmount} has been added to your wallet!`, {
            position: "top-center",
            autoClose: 5000,
          });
          
          // Refresh wallet data and transactions
          await refreshWalletData();
        }
      }
    } catch (error: any) {
      console.error('Cancel appointment error:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
      setShowCancelDialog(null);
      setCancelReason('');
    }
  };

  // Filter appointments based on selected status
  const filteredAppointments = appointments.filter(appointment => {
    if (filterStatus === 'all') return true;
    return appointment.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const CancelDialog = ({ appointmentId, appointment }: { appointmentId: string, appointment: AppointmentData }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cancel Appointment</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Are you sure you want to cancel this appointment?
          </p>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p><strong>Doctor:</strong> {appointment.doctor?.name || 'N/A'}</p>
            <p><strong>Date:</strong> {formatDate(appointment.date)}</p>
            <p><strong>Time:</strong> {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</p>
            <p><strong>Fee:</strong> ₹{appointment.consultationFee}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for cancellation (optional)
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Enter reason..."
            className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-sm text-yellow-800">
            {canCancelAppointment(appointment) 
              ? "✓ Refund will be processed to your wallet if payment was made."
              : "⚠️ You cannot cancel appointments within 2 hours of the scheduled time."
            }
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowCancelDialog(null);
              setCancelReason('');
            }}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Keep Appointment
          </button>
          <button
            onClick={() => handleCancelAppointment(appointmentId)}
            disabled={cancellingId === appointmentId}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancellingId === appointmentId ? 'Cancelling...' : 'Cancel Appointment'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!appointments.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">My Appointments</h1>
            <button
              onClick={() => navigate('/wallet')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Wallet
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500 mb-6">You haven't booked any appointments yet.</p>
            <button
              onClick={() => navigate('/home')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              Book Your First Appointment
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Appointments</h1>
            <p className="text-gray-600">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Wallet
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 bg-white p-1 rounded-lg shadow-sm">
            {['all', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-1 text-xs">
                  ({status === 'all' ? appointments.length : appointments.filter(apt => apt.status.toLowerCase() === status).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {filteredAppointments.map((appointment) => (
            <div key={appointment._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(appointment.paymentStatus)}`}>
                      Payment: {appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>ID: #{appointment._id.slice(-8).toUpperCase()}</p>
                    <p>{getTimeUntilAppointment(appointment)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Appointment Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fee:</span>
                        <span className="font-medium">₹{appointment.consultationFee}</span>
                      </div>
                      {appointment.doctor && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Doctor:</span>
                            <span className="font-medium">Dr. {appointment.doctor.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Specialization:</span>
                            <span className="font-medium">{appointment.doctor.specialization.name}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Additional Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Booked on:</span>
                        <span className="font-medium">
                          {new Date(appointment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {appointment.notes && (
                        <div>
                          <span className="text-gray-600">Notes:</span>
                          <p className="font-medium text-gray-800 mt-1">{appointment.notes}</p>
                        </div>
                      )}
                      {appointment.paymentStatus === 'refunded' && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm text-blue-700">
                            ✓ Refund of ₹{appointment.consultationFee} processed to your wallet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <>
                      <button
                        onClick={() => setShowCancelDialog(appointment._id)}
                        disabled={cancellingId === appointment._id}
                        className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                          canCancelAppointment(appointment)
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {canCancelAppointment(appointment) ? 'Cancel Appointment' : 'Cannot Cancel'}
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => navigate(`/appointments/${appointment._id}`)}
                    className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state for filtered results */}
        {filteredAppointments.length === 0 && appointments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {filterStatus} appointments found</h3>
            <p className="text-gray-500 mb-4">Try selecting a different status filter.</p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
          >
            Book Another Appointment
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Cancel Dialog */}
      {showCancelDialog && (
        <CancelDialog 
          appointmentId={showCancelDialog} 
          appointment={appointments.find(apt => apt._id === showCancelDialog)!}
        />
      )}
      
      <ToastContainer />
    </div>
  );
};

export default ViewAppointment;