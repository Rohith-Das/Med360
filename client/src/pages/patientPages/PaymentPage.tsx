// src/pages/patientPages/PaymentPage.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StripeProvider } from '../../components/providers/StripeProvider';
import { StripePaymentForm } from '../../components/payment/StripePaymentForm';
import { toast, ToastContainer } from 'react-toastify';
import Navbar from '../../components/patient/Navbar';
import axiosInstance from '../../api/axiosInstance';

interface PaymentPageData {
  clientSecret: string;
  appointmentId: string;
  paymentId: string;
  bookingData: {
    doctor: {
      id: string;
      name: string;
      consultationFee: number;
      specialization: { name: string };
    };
    timeSlot: {
      date: string;
      startTime: string;
      endTime: string;
    };
  };
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentData, setPaymentData] = useState<PaymentPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = location.state as PaymentPageData;
    
    if (!data || !data.clientSecret || !data.bookingData) {
      toast.error('Payment data not found. Please try booking again.');
      navigate('/home');
      return;
    }
    
    setPaymentData(data);
    setLoading(false);
  }, [location, navigate]);

  const handlePaymentSuccess = async () => {
    if (!paymentData) return;
    
    try {
      setLoading(true);
      
      // Optional: Confirm payment on backend
      // await axiosInstance.post('/payment/confirm', {
      //   paymentIntentId: paymentData.paymentId
      // });
      
      toast.success('Payment successful! Your appointment has been booked.');
      
      // Navigate to success page
      navigate('/payment/success', {
        state: {
          appointmentId: paymentData.appointmentId,
          bookingData: paymentData.bookingData,
        },
      });
    } catch (error: any) {
      console.error('Payment success handling error:', error);
      toast.error('Payment was successful, but there was an issue confirming your booking. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error(error);
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

  if (loading || !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Loading payment...</p>
          </div>
        </div>
      </div>
    );
  }

  const { bookingData, clientSecret } = paymentData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Complete Payment</h1>
          <p className="text-gray-600">Secure payment powered by Stripe</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Booking Summary</h2>
            
            {/* Doctor Info */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Doctor</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-800">Dr. {bookingData.doctor.name}</p>
                <p className="text-blue-600">{bookingData.doctor.specialization.name}</p>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Appointment</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-800">{formatDate(bookingData.timeSlot.date)}</p>
                <p className="text-gray-600">
                  {formatTime(bookingData.timeSlot.startTime)} - {formatTime(bookingData.timeSlot.endTime)}
                </p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Consultation Fee</span>
                <span className="font-semibold">₹{bookingData.doctor.consultationFee}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-semibold">₹0</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total</span>
                  <span className="text-xl font-bold text-green-600">₹{bookingData.doctor.consultationFee}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Payment Details</h2>
            
            <StripeProvider clientSecret={clientSecret}>
              <StripePaymentForm
                clientSecret={clientSecret}
                amount={bookingData.doctor.consultationFee}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </StripeProvider>

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Your payment information is secure and encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ToastContainer />
    </div>
  );
};

export default PaymentPage;