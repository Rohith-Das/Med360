import React, { useEffect } from 'react'
import { useAppDispatch,useAppSelector } from '@/app/hooks'
import { getDoctors } from '@/features/Doctor/doctorThunk'
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function DoctorsCards() {
    const dispatch=useAppDispatch()
    const {doctors,status,error}=useAppSelector((state)=>state.doctors);

    useEffect(()=>{
        dispatch(getDoctors())
    },[dispatch])

  return (
     <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Our Doctors</h1>
        {status === 'loading' && <p className="text-center">Loading doctors...</p>}
        {status === 'failed' && <p className="text-center text-red-500">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <img
                src={doctor.profileImage || 'https://via.placeholder.com/150'}
                alt={doctor.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <h2 className="text-xl font-semibold text-center">{doctor.name}</h2>
              <p className="text-gray-600 text-center">{doctor.specialization.name}</p>
              <p className="text-gray-600 text-center">Experience: {doctor.experience} years</p>
              <p className="text-gray-600 text-center">Fee: ${doctor.consultationFee}</p>
              <p className="text-gray-600 text-center">Languages: {doctor.languages.join(', ')}</p>
              <p className="text-gray-600 text-center">State: {doctor.licensedState}</p>
              <button
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                onClick={() => alert(`Book appointment with Dr. ${doctor.name}`)} // Replace with actual booking logic
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}

export default DoctorsCards