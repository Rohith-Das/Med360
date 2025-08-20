import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '@/components/patient/Navbar';

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: { name: string; imageUrl: string };
  experience: number;
  languages: string[];
  licensedState: string;
  profileImage?: string;
  consultationFee: number;
  age?: number;
  gender?: string;
}

interface TimeSlot {
  id: string;
  scheduleId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isActive: boolean;
}

interface BookingData {
  doctor: Doctor;
  timeSlot: TimeSlot;
}

const BookSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth.patient);
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get booking data from navigation state
    const data = location.state?.bookingData as BookingData;
    
    if (!data || !data.doctor || !data.timeSlot) {
      toast.error('Booking data not found. Please select a time slot again.');
      navigate('/home');
      return;
    }
    
    setBookingData(data);
  }, [location, navigate]);

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

  const handlePaymentRedirect = async () => {
    if (!bookingData) return;
    
    setLoading(true);
    
    try {
      // Here you would typically create a payment session with Stripe
      // For now, we'll simulate the process
      
      const paymentData = {
        doctorId: bookingData.doctor.id,
        patientId: user?.id,
        timeSlotId: bookingData.timeSlot.id,
        scheduleId: bookingData.timeSlot.scheduleId,
        amount: bookingData.doctor.consultationFee,
        date: bookingData.timeSlot.date,
        startTime: bookingData.timeSlot.startTime,
        endTime: bookingData.timeSlot.endTime,
      };

      // TODO: Replace with actual Stripe integration
      console.log('Redirecting to payment gateway with data:', paymentData);
      
      // Simulate payment gateway redirect
      toast.info('Redirecting to payment gateway...');
      
      // You would typically call your backend to create a Stripe session
      // const response = await createPaymentSession(paymentData);
      // window.location.href = response.data.url;
      
    } catch (error: any) {
      console.error('Payment redirect error:', error);
      toast.error('Failed to redirect to payment gateway. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBooking = () => {
    navigate(-1); // Go back to doctor selection
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  const { doctor, timeSlot } = bookingData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Summary</h1>
          <p className="text-gray-600">Please review your appointment details before proceeding to payment</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Appointment Details</h2>
          </div>

          <div className="p-6">
            {/* Doctor Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Doctor Information
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4">
                <img
                  src={doctor.profileImage || "https://via.placeholder.com/80"}
                  alt={doctor.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                />
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-800">Dr. {doctor.name}</h4>
                  <p className="text-blue-600 font-medium">{doctor.specialization.name}</p>
                  <div className="text-sm text-gray-600 mt-1">
                    <p><span className="font-medium">{doctor.experience}+ years</span> of experience</p>
                    {doctor.age && <p>Age: {doctor.age}</p>}
                    {doctor.gender && <p>Gender: {doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1)}</p>}
                    <p>Languages: {doctor.languages.join(", ")}</p>
                    <p>Licensed State: {doctor.licensedState}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Schedule */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Appointment Schedule
              </h3>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date</p>
                    <p className="font-semibold text-gray-800">{formatDate(timeSlot.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Time</p>
                    <p className="font-semibold text-gray-800">
                      {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Patient Information
              </h3>
              
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Patient Name</p>
                    <p className="font-semibold text-gray-800">{user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold text-gray-800">{user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Mobile</p>
                    <p className="font-semibold text-gray-800">{user?.mobile || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Payment Summary
              </h3>
              
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Consultation Fee</span>
                  <span className="font-semibold">₹{doctor.consultationFee}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Platform Fee</span>
                  <span className="font-semibold">₹0</span>
                </div>
                <div className="border-t border-yellow-300 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Total Amount</span>
                    <span className="text-xl font-bold text-green-600">₹{doctor.consultationFee}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Important Notes
              </h3>
              
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Please arrive 10 minutes before your scheduled appointment time</li>
                  <li>• Carry a valid ID proof and any previous medical records</li>
                  <li>• Cancellation is allowed up to 2 hours before the appointment</li>
                  <li>• Refunds will be processed within 5-7 business days for valid cancellations</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={handleEditBooking}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Edit Booking
              </button>
              <button
                onClick={handlePaymentRedirect}
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg'
                }`}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    Proceed to Payment
                    <svg className="h-5 w-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <ToastContainer />
    </div>
  );
};

export default BookSummaryPage;