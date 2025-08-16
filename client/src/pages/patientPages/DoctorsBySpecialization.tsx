import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useParams } from 'react-router-dom';
import { getDoctorsBySpecialization } from '@/features/Doctor/doctorThunk';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '@/components/patient/Navbar';

interface FilterState {
  search: string;
  experience: number;
  age: number;
  gender: string;
  language: string;
  consultationFee: number;
}

const DoctorsBySpecialization: React.FC = () => {
  const dispatch = useAppDispatch();
  const { specializationId } = useParams<{ specializationId: string }>();
  const { doctors, status, error } = useAppSelector((state) => state.doctors);

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

  useEffect(() => {
    if (specializationId) {
      dispatch(getDoctorsBySpecialization(specializationId));
    }
  }, [dispatch, specializationId]);

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
      // Search filter
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

      // Experience filter
      if (filters.experience && doctor.experience < filters.experience) {
        return false;
      }

      // Age filter
      if (filters.age && doctor.age && doctor.age < filters.age) {
        return false;
      }

      // Gender filter
      if (filters.gender && doctor.gender && doctor.gender !== filters.gender) {
        return false;
      }

      // Language filter
      if (filters.language && !doctor.languages?.includes(filters.language)) {
        return false;
      }

      // Consultation fee filter
      if (filters.consultationFee && doctor.consultationFee < filters.consultationFee) {
        return false;
      }

      return true;
    });

    // Calculate pagination
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

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filters, totalPages, currentPage]);

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
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
          {/* Search Bar and Controls */}
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

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-all duration-500 ease-in-out transform">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Experience Filter */}
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

                {/* Age Filter */}
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

                {/* Gender Filter */}
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

                {/* Language Filter */}
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

                {/* Consultation Fee Filter */}
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

        {/* Results Count and Pagination Info */}
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

        {/* Doctors List */}
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
                  {/* Profile Image */}
                  <div className="flex items-center space-x-4">
                    <img
                      src={doctor.profileImage || "https://via.placeholder.com/100"}
                      alt={doctor.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    {/* Doctor Info */}
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

                  {/* Actions */}
                  <div className="flex flex-col items-end space-y-2">
                    <p className="text-gray-900 font-semibold">
                      ₹ {doctor.consultationFee} <span className="text-sm">per consultation</span>
                    </p>
                    <button className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-all duration-200">
                      View Profile
                    </button>
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                      onClick={() => alert(`Book appointment with Dr. ${doctor.name}`)}
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default DoctorsBySpecialization;