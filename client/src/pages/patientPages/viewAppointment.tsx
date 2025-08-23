import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/patient/Navbar';
import { toast, ToastContainer } from 'react-toastify';

interface viewAppointmentData{
    appointmentId:string;
    bookingData:{
        doctor:{
            name:string;
            consultationFee:number;
            specialization:{name:string}
        };
        timeSlot:{
            date:string;
            startTime:string;
            endTime:string
        }
    }
}

const ViewAppointment: React.FC = () => {

    const navigate=useNavigate()
    const location=useLocation()
    const [viewAppointmentData,setViewAppointmentData]=useState<viewAppointmentData|null>(null)

    useEffect(()=>{
        const data=location.state as viewAppointmentData;
        if(!data || !data.appointmentId){
            toast.error('view Appointment not found')
            navigate('/home')
            return;
        }

        setViewAppointmentData(data)
    },[location,navigate])

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
 if (!viewAppointmentData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Loading...</p>
          </div>
        </div>
      </div>
    );
  }


    return(
          <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-green-600 mb-2">Appointments !</h1>

          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointment Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Appointment ID:</span>
                <span className="font-medium">#{viewAppointmentData.appointmentId.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">₹{viewAppointmentData.bookingData.doctor.consultationFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor:</span>
                <span className="font-medium">Dr. {viewAppointmentData.bookingData.doctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Specialization:</span>
                <span className="font-medium">{viewAppointmentData.bookingData.doctor.specialization.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{formatDate(viewAppointmentData.bookingData.timeSlot.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {formatTime(viewAppointmentData.bookingData.timeSlot.startTime)} - {formatTime(viewAppointmentData.bookingData.timeSlot.endTime)}
                </span>
              </div>
            </div>
          </div>

       

     
        </div>
      </div>
      
      <ToastContainer />
    </div>
    )
}

export default ViewAppointment;