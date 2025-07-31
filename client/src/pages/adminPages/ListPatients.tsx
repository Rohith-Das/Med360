import React, { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/adminSidebar';
import { adminApi, Patient, PatientStats } from '../../features/admin/adminPatientApi';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { adminRefreshToken } from '../../features/auth/adminAuthThunk';
import { NavLink } from 'react-router-dom';
import AdminNavbar from '@/components/admin/adminNavbar';
import { ToastContainer,toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'

interface Filters {
  page: number;
  limit: number;
  isBlocked?: boolean;
  isDeleted?: boolean;
  searchTerm: string;
}

const ListPatients: React.FC = () => {
  const dispatch = useAppDispatch();
  const { adminAccessToken, isAuthenticated } = useAppSelector(state => state.adminAuth);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 10,
    searchTerm: '',
  });
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!adminAccessToken && isAuthenticated) {
        try {
          await dispatch(adminRefreshToken()).unwrap();
        } catch (error) {
          console.error('Failed to refresh token on init:', error);
        }
      }
    };

    initializeAuth();
  }, [dispatch, adminAccessToken, isAuthenticated]);

  const fetchPatients = async () => {
    if (!isAuthenticated) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPatients(filters);
      setPatients(data.patients);
      setTotalPages(data.totalPage);
      setTotal(data.total);
    } catch (error: any) {
      console.error('Fetch patients error:', error);
      setError(error.response?.data?.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!isAuthenticated) return;

    try {
      const data = await adminApi.getPatientStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminAccessToken) {
      fetchPatients();
      fetchStats();
    }
  }, [filters, isAuthenticated, adminAccessToken]);

  const handleBlockPatient = async (patientId: string) => {
    try {
      await adminApi.blockPatient(patientId);
      fetchPatients();
      fetchStats();
     toast.success('Patient blocked successfully');
    } catch (err: any) {
       toast.error(err.response?.data?.message || 'Failed to block patient');
    }
  };

  const handleUnblockPatient = async (patientId: string) => {
    try {
      await adminApi.unblockPatient(patientId);
      fetchPatients();
      fetchStats();
    toast.success('Patient unblocked successfully');
    } catch (err: any) {
  toast.error(err.response?.data?.message || 'Failed to unblock patient');    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await adminApi.deletePatient(patientId);
        fetchPatients();
        fetchStats();
       toast.success('Patient deleted successfully');
      } catch (err: any) {
  toast.error(err.response?.data?.message || 'Failed to delete patient');      }
    }
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      searchTerm,
      page: 1,
    }));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 text-sm sm:text-base">Please log in to access the patient list.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
        <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <AdminNavbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      
      {/* Main Content Area */}
      <div className="flex pt-16 min-h-[calc(100vh-4rem)]">
        {/* Sidebar Spacer */}
        <div className="hidden lg:block w-64 flex-shrink-0"></div>
        
        {/* Patient List Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-full mx-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Patient List</h2>

            {/* Search and Stats */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-full sm:max-w-md">
                  <input
                    type="text"
                    placeholder="Search by name, email, mobile..."
                    value={filters.searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full p-2 sm:p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                  <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm sm:text-base">Total Patients: {total}</p>
              </div>

              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700">Active Patients</h3>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.activePatients}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700">Blocked Patients</h3>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.blockedPatients}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700">Deleted Patients</h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-600">{stats.deletedPatients}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
              <button
                className={`px-3 py-2 rounded-md text-sm sm:text-base ${filters.isBlocked === undefined && filters.isDeleted === undefined ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setFilters(prev => ({ ...prev, isBlocked: undefined, isDeleted: undefined, page: 1 }))}
              >
                ALL
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm sm:text-base ${filters.isBlocked === true ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setFilters(prev => ({ ...prev, isBlocked: true, isDeleted: false, page: 1 }))}
              >
                BLOCKED
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm sm:text-base ${filters.isBlocked === false && filters.isDeleted === false ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setFilters(prev => ({ ...prev, isBlocked: false, isDeleted: false, page: 1 }))}
              >
                ACTIVE
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm sm:text-base ${filters.isDeleted === true ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setFilters(prev => ({ ...prev, isDeleted: true, page: 1 }))}
              >
                DELETED
              </button>
            </div>

            {/* Patients Table */}
            {loading ? (
              <div className="text-center py-8 text-sm sm:text-base">Loading patients...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600 text-sm sm:text-base">Error: {error}</div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Mobile</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm sm:text-base">{p.name}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm sm:text-base hidden sm:table-cell">{p.email}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm sm:text-base hidden md:table-cell">{p.mobile}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full ${p.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {p.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => p.isBlocked ? handleUnblockPatient(p.id) : handleBlockPatient(p.id)}
                            className={`px-3 py-1 rounded-md text-xs sm:text-sm ${p.isBlocked ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}
                          >
                            {p.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            onClick={() => handleDeletePatient(p.id)}
                            className="px-3 py-1 rounded-md text-xs sm:text-sm bg-red-600 text-white"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4">
                  <button
                    disabled={filters.page === 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 text-sm sm:text-base"
                  >
                    Prev
                  </button>
                  <span className="text-gray-600 text-sm sm:text-base">Page {filters.page} of {totalPages}</span>
                  <button
                    disabled={filters.page === totalPages}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 text-sm sm:text-base"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListPatients;