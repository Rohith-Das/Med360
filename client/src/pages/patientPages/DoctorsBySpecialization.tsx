import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useParams } from 'react-router-dom';
import { getDoctorsBySpecialization, getDoctorSchedules } from '@/features/Doctor/doctorThunk';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '@/components/patient/Navbar';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/patient/FirstpageComponents/Footer';

interface FilterState {
  search: string;
  experience: number;
  age: number;
  gender: string;
  language: string;
  consultationFee: number;
}

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

const DoctorsBySpecialization: React.FC = () => {
  const dispatch = useAppDispatch();
  const { specializationId } = useParams<{ specializationId: string }>();
  const { doctors, timeSlots, status, error } = useAppSelector((state) => state.doctors);
  const navigate=useNavigate()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    experience: 0,
    age: 0,
    gender: '',
    language: '',
    consultationFee: 0,
  });

  // Show/hide filters
  const [showFilters, setShowFilters] = useState(false);

  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    if (specializationId) {
      dispatch(getDoctorsBySpecialization(specializationId));
    }
  }, [dispatch, specializationId]);

  // Fetch doctor's schedules when modal is opened
  const handleOpenBookingModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    dispatch(getDoctorSchedules(doctor.id))
      .unwrap()
      .then(() => setIsBookingModalOpen(true))
      .catch((err) => toast.error(err.message || "Failed to fetch doctor's schedules"));
  };


  // Get unique languages from all doctors
  const availableLanguages = useMemo(() => {
    const languages = new Set<string>();
    doctors.forEach(doctor => {
      doctor.languages?.forEach(lang => languages.add(lang));
    });
    return Array.from(languages).sort();
  }, [doctors]);

  // Combined filter and search logic
  const { filteredDoctors, totalPages, currentDoctors } = useMemo(() => {
    const filtered = doctors.filter(doctor => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesName = doctor.name.toLowerCase().includes(searchTerm);
        const matchesSpecialization = doctor.specialization?.name?.toLowerCase().includes(searchTerm);
        const matchesLanguages = doctor.languages?.some(lang => 
          lang.toLowerCase().includes(searchTerm)
        );
        if (!matchesName && !matchesSpecialization && !matchesLanguages) {
          return false;
        }
      }
      if (filters.experience && doctor.experience < filters.experience) {
        return false;
      }
      if (filters.age && doctor.age && doctor.age < filters.age) {
        return false;
      }
      if (filters.gender && doctor.gender && doctor.gender !== filters.gender) {
        return false;
      }
      if (filters.language && !doctor.languages?.includes(filters.language)) {
        return false;
      }
      if (filters.consultationFee && doctor.consultationFee < filters.consultationFee) {
        return false;
      }
      return true;
    });

    const pages = Math.ceil(filtered.length / itemsPerPage);
    const validCurrentPage = Math.min(currentPage, Math.max(1, pages));
    const startIdx = (validCurrentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedResults = filtered.slice(startIdx, endIdx);

    return {
      filteredDoctors: filtered,
      totalPages: pages,
      currentDoctors: paginatedResults
    };
  }, [doctors, filters, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filters, totalPages, currentPage]);

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

    const handleConfirmBooking = () => {
    if (!selectedDoctor || !selectedTimeSlot) {
      toast.error('Please select a time slot');
      return;
    }

    // Close modal
    setIsBookingModalOpen(false);

    // Navigate to BookSummaryPage with booking data
    navigate('/book-summary', {
      state: {
        bookingData: {
          doctor: selectedDoctor,
          timeSlot: selectedTimeSlot
        }
      }
    });

    // Reset selections
    setSelectedTimeSlot(null);
    setSelectedDoctor(null);
  };


  const clearFilters = () => {
    setFilters({
      search: '',
      experience: 0,
      age: 0,
      gender: '',
      language: '',
      consultationFee: 0,
    });
    setCurrentPage(1);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (currentPage > 1) {
      pages.push(
        <button
          key="first"
          onClick={() => setCurrentPage(1)}
          className="px-3 py-2 mx-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          title="First page"
        >
          ««
        </button>
      );
      pages.push(
        <button
          key="prev"
          onClick={() => setCurrentPage(currentPage - 1)}
          className="px-3 py-2 mx-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          title="Previous page"
        >
          ‹
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-2 mx-1 text-sm font-medium rounded-md ${
            currentPage === i
              ? 'text-white bg-blue-600 border border-blue-600'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => setCurrentPage(currentPage + 1)}
          className="px-3 py-2 mx-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          title="Next page"
        >
          ›
        </button>
      );
      pages.push(
        <button
          key="last"
          onClick={() => setCurrentPage(totalPages)}
          className="px-3 py-2 mx-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          title="Last page"
        >
          »»
        </button>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8">
        <div className="flex justify-center items-center space-x-1 mb-4 sm:mb-0">
          {pages}
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage + 1)} to {Math.min(currentPage * itemsPerPage, filteredDoctors.length)} of {filteredDoctors.length} results
        </div>
      </div>
    );
  };

  if (status === 'loading') {
    return (
      <div className="">
        <Navbar />
        <div className="py-12 text-center text-lg font-semibold text-gray-700">Loading doctors...</div>
      </div>
    );
  }

  if (error) {
    toast.error(error);
    return (
      <div className="">
        <Navbar />
        <div className="py-12 text-center text-lg font-semibold text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Find Your Doctor</h1>

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name, specialization, or language..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm placeholder-gray-400 bg-white transition-all duration-300 hover:shadow-md"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>
            <button
              onClick={clearFilters}
              className="px-5 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Clear Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-all duration-500 ease-in-out transform">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>Minimum Experience (Years)</span>
                    <span className="text-gray-400 cursor-help" title="Select minimum years of experience">
                      ⓘ
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={filters.experience}
                    onChange={(e) => handleFilterChange('experience', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-blue-500"
                  />
                  <div className="text-sm text-gray-600">
                    {filters.experience === 0 ? 'Any' : `${filters.experience}+ years`}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>Minimum Age</span>
                    <span className="text-gray-400 cursor-help" title="Select minimum age of doctor">
                      ⓘ
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={filters.age}
                    onChange={(e) => handleFilterChange('age', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-blue-500"
                  />
                  <div className="text-sm text-gray-600">
                    {filters.age === 0 ? 'Any' : `${filters.age}+ years`}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>Gender</span>
                    <span className="text-gray-400 cursor-help" title="Filter by doctor's gender">
                      ⓘ
                    </span>
                  </label>
                  <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white transition-all duration-200 hover:shadow-md"
                  >
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>Language</span>
                    <span className="text-gray-400 cursor-help" title="Filter by languages spoken">
                      ⓘ
                    </span>
                  </label>
                  <select
                    value={filters.language}
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white transition-all duration-200 hover:shadow-md"
                  >
                    <option value="">All Languages</option>
                    {availableLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>Minimum Consultation Fee (₹)</span>
                    <span className="text-gray-400 cursor-help" title="Select minimum consultation fee">
                      ⓘ
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={filters.consultationFee}
                    onChange={(e) => handleFilterChange('consultationFee', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-blue-500"
                  />
                  <div className="text-sm text-gray-600">
                    {filters.consultationFee === 0 ? 'Any' : `₹${filters.consultationFee}+`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600 text-sm">
            Showing {currentDoctors.length > 0 ? ((currentPage - 1) * itemsPerPage + 1) : 0}-{Math.min(currentPage * itemsPerPage, filteredDoctors.length)} of {filteredDoctors.length} doctors
            {filteredDoctors.length !== doctors.length && ` (filtered from ${doctors.length} total)`}
          </p>
          
          {totalPages > 1 && (
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>Page {currentPage} of {totalPages}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const newItemsPerPage = parseInt(e.target.value);
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white transition-all duration-200"
              >
                <option value={3}>3 per page</option>
                <option value={6}>6 per page</option>
                <option value={9}>9 per page</option>
                <option value={12}>12 per page</option>
              </select>
            </div>
          )}
        </div>

        {!currentDoctors.length ? (
          <div className="py-12 text-center text-lg font-semibold text-gray-500">
            No doctors found matching your criteria.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={doctor.profileImage || "https://via.placeholder.com/100"}
                      alt={doctor.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Dr. {doctor.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {doctor.specialization?.name}
                      </p>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-semibold">{doctor.experience}+ years</span> of experience
                        {doctor.age && (
                          <span> | Age: {doctor.age}</span>
                        )}
                        {doctor.gender && (
                          <span> | {doctor.gender}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Speaks {doctor.languages?.join(", ")}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <p className="text-gray-900 font-semibold">
                      ₹ {doctor.consultationFee} <span className="text-sm">per consultation</span>
                    </p>
                    <button className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-all duration-200">
                      View Profile
                    </button>
                    <button
                      onClick={() => handleOpenBookingModal(doctor)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {renderPagination()}
          </>
        )}

        {isBookingModalOpen && selectedDoctor && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Book Appointment with Dr. {selectedDoctor.name}
        </h2>
        <button
          onClick={() => {
            setIsBookingModalOpen(false);
            setSelectedTimeSlot(null);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {status === 'loading' ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading available time slots...</p>
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No available time slots for Dr. {selectedDoctor.name}.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
              <span>Unavailable</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span>Selected</span>
            </div>
          </div>

          {[...new Set(timeSlots.map(slot => new Date(slot.date).toDateString()))].map(dateStr => (
            <div key={dateStr} className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                {new Date(dateStr).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {timeSlots
                  .filter(slot => new Date(slot.date).toDateString() === dateStr)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(slot => {
                    const isAvailable = !slot.isBooked && slot.isActive;
                    const isSelected = selectedTimeSlot?.id === slot.id;
                    const isBooked = slot.isBooked;
                    
                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedTimeSlot(slot);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                          isBooked
                            ? 'bg-red-100 text-red-700 border border-red-300 cursor-not-allowed'
                            : !slot.isActive
                            ? 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{slot.startTime} - {slot.endTime}</span>
                          {isBooked && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </div>
                        {isBooked && (
                          <div className="text-xs mt-1 font-semibold">BOOKED</div>
                        )}
                        {!slot.isActive && !slot.isBooked && (
                          <div className="text-xs mt-1">Unavailable</div>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {timeSlots.length > 0 && (
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => {
              setIsBookingModalOpen(false);
              setSelectedTimeSlot(null);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={!selectedTimeSlot}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedTimeSlot
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm Booking
          </button>
        </div>
      )}
    </div>
  </div>

)}
      </div>
      <div className='mt-8'><Footer /></div>
      
      <ToastContainer />
    </div>
  );
};

export default DoctorsBySpecialization;