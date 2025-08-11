import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getDoctors, updateDoctor, blockDoctor, unblockDoctor } from '@/features/admin/DoctorMgtThunk';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminNavbar from '@/components/admin/adminNavbar';
import { FiEye, FiEdit2, FiLock, FiUnlock, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaUserMd } from 'react-icons/fa';

const ListDoctors: React.FC = () => {
  const dispatch = useAppDispatch();
  const { doctors, status, error } = useAppSelector((state) => state.adminDoctors);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    experience: 0,
    consultationFee: 0,
    education: '',
    gender: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    dispatch(getDoctors());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.specialization?.name && doctor.specialization.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filteredDoctors.slice(indexOfFirstDoctor, indexOfLastDoctor);
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleView = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsViewModalOpen(true);
  };

  const handleEdit = (doctor: any) => {
    if (!doctor?._id) {
      toast.error('Invalid doctor data');
      return;
    }
    
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor.name || '',
      phone: doctor.phone || '',
      experience: doctor.experience || 0,
      consultationFee: doctor.consultationFee || 0,
      education: doctor.education || '',
      gender: doctor.gender || '',
      dateOfBirth: doctor.dateOfBirth ? new Date(doctor.dateOfBirth).toISOString().split('T')[0] : '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor?._id) {
      toast.error('No doctor selected');
      return;
    }
    
    try {
      await dispatch(updateDoctor({ 
        id: selectedDoctor._id, 
        data: formData 
      })).unwrap();
      toast.success('Doctor updated successfully');
      setIsEditModalOpen(false);
      dispatch(getDoctors());
    } catch (err: any) {
      toast.error(err.message || 'Failed to update doctor');
    }
  };

  const handleBlock = async (doctor: any) => {
    if (!doctor?._id) {
      toast.error('Invalid doctor ID');
      return;
    }
    
    try {
      await dispatch(blockDoctor(doctor._id)).unwrap();
      toast.success('Doctor blocked successfully');
      dispatch(getDoctors());
    } catch (err: any) {
      toast.error(err.message || 'Failed to block doctor');
    }
  };

  const handleUnblock = async (doctor: any) => {
    if (!doctor?._id) {
      toast.error('Invalid doctor ID');
      return;
    }
    
    try {
      await dispatch(unblockDoctor(doctor._id)).unwrap();
      toast.success('Doctor unblocked successfully');
      dispatch(getDoctors());
    } catch (err: any) {
      toast.error(err.message || 'Failed to unblock doctor');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      <div className="flex pt-16 min-h-[calc(100vh-4rem)]">
        <div className="hidden lg:block w-64 flex-shrink-0"></div>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-full mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center">
                <FaUserMd className="text-blue-600 text-3xl mr-3" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Doctor Management</h1>
              </div>
              
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search doctors..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {status === 'loading' ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Specialization</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Blocked</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentDoctors.length > 0 ? (
                          currentDoctors.map((doctor) => (
                            <tr key={doctor._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <img 
                                      className="h-10 w-10 rounded-full" 
                                      src={doctor.profileImage || 'https://via.placeholder.com/150'} 
                                      alt={doctor.name} 
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                                    <div className="text-sm text-gray-500 sm:hidden">{doctor.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{doctor.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {doctor.specialization?.name || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${doctor.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                    doctor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-red-100 text-red-800'}`}>
                                  {doctor.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                {doctor.isBlocked ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    Blocked
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleView(doctor)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                    title="View"
                                  >
                                    <FiEye className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(doctor)}
                                    className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                                    title="Edit"
                                  >
                                    <FiEdit2 className="h-5 w-5" />
                                  </button>
                                  {doctor.isBlocked ? (
                                    <button
                                      onClick={() => handleUnblock(doctor)}
                                      className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                                      title="Unblock"
                                    >
                                      <FiUnlock className="h-5 w-5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleBlock(doctor)}
                                      className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                      title="Block"
                                    >
                                      <FiLock className="h-5 w-5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              {searchTerm ? 'No doctors match your search' : 'No doctors found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {filteredDoctors.length > doctorsPerPage && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{indexOfFirstDoctor + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(indexOfLastDoctor, filteredDoctors.length)}</span> of{' '}
                            <span className="font-medium">{filteredDoctors.length}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => paginate(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Previous</span>
                              <FiChevronLeft className="h-5 w-5" />
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                              <button
                                key={number}
                                onClick={() => paginate(number)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium 
                                  ${currentPage === number 
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                              >
                                {number}
                              </button>
                            ))}
                            
                            <button
                              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Next</span>
                              <FiChevronRight className="h-5 w-5" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* View Modal */}
          {isViewModalOpen && selectedDoctor && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsViewModalOpen(false)}></div>
                </div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Doctor Details</h3>
                          <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <FiX className="h-6 w-6" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-500">Name:</span>
                              <p className="mt-1 text-sm text-gray-900">{selectedDoctor.name}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Email:</span>
                              <p className="mt-1 text-sm text-gray-900">{selectedDoctor.email}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Phone:</span>
                              <p className="mt-1 text-sm text-gray-900">{selectedDoctor.phone}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Specialization:</span>
                              <p className="mt-1 text-sm text-gray-900">{selectedDoctor.specialization?.name || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Experience:</span>
                              <p className="mt-1 text-sm text-gray-900">{selectedDoctor.experience} years</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-500">Education:</span>
                              <p className="mt-1 text-sm text-gray-900">{selectedDoctor.education || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Gender:</span>
                              <p className="mt-1 text-sm text-gray-900">{selectedDoctor.gender || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
                              <p className="mt-1 text-sm text-gray-900">
                                {selectedDoctor.dateOfBirth ? new Date(selectedDoctor.dateOfBirth).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Consultation Fee:</span>
                              <p className="mt-1 text-sm text-gray-900">${selectedDoctor.consultationFee || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Status:</span>
                              <span className={`mt-1 text-xs px-2 py-1 rounded-full 
                                ${selectedDoctor.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  selectedDoctor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                {selectedDoctor.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <span className="text-sm font-medium text-gray-500">Profile Image:</span>
                          <div className="mt-2 flex justify-center">
                            <img
                              src={selectedDoctor.profileImage || 'https://via.placeholder.com/150'}
                              alt={selectedDoctor.name}
                              className="h-32 w-32 rounded-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setIsViewModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {isEditModalOpen && selectedDoctor && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsEditModalOpen(false)}></div>
                </div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Doctor</h3>
                          <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <FiX className="h-6 w-6" />
                          </button>
                        </div>
                        
                        <form onSubmit={handleEditSubmit}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Name</label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Phone</label>
                              <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
                              <input
                                type="number"
                                value={formData.experience}
                                onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Consultation Fee ($)</label>
                              <input
                                type="number"
                                value={formData.consultationFee}
                                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Education</label>
                              <input
                                type="text"
                                value={formData.education}
                                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Gender</label>
                              <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                              <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button
                              type="submit"
                              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                            >
                              Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditModalOpen(false)}
                              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default ListDoctors;