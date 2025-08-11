import { useCallback, useEffect, useState } from 'react';
import adminAxiosInstance from '../../api/adminAxiosInstance';
import { Application } from '@/types/application';
import AdminNavbar from '@/components/admin/adminNavbar';
import { Search } from 'lucide-react';
import { debounce } from 'lodash';
import { ToastContainer,toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const applicationsPerPage = 10;
  const [searchTerms,setSearchTerms]=useState("")
  const navigate=useNavigate()

  const fetchApplications=useCallback(
    debounce(async(page:number,term:string)=>{
      try {
        setLoading(true)
        const queryParams=new URLSearchParams({
          page:page.toString(),
          limit:applicationsPerPage.toString(),
          ...(term &&{search:term.trim()})
        })
        const response=await adminAxiosInstance.get(`/admin/applications?${queryParams}`);
        setApplications(response.data.data.applications)
        setTotalPages(response.data.data.totalPages)
      } catch (err) {
         setError('Failed to fetch applications');
        console.error(err);
      }
      finally {
        setLoading(false);
      }
    },300),
    []
  );

  useEffect(()=>{
    fetchApplications(currentPage,searchTerms);
  },[currentPage,searchTerms, fetchApplications]);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedApplication(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDocument = (url: string) => {
    window.open(url, '_blank');
  };

  const handleApprove=async (applicationId:string)=>{
    try {
      await adminAxiosInstance.post(`/admin/applications/${applicationId}/approve`);
      navigate(`/admin/doctors/create/${applicationId}`)
    } catch (err) {
      toast.error('Failed to approve application');
      console.error(err);
    }
  }

  const handleReject=async(applicationId:string)=>{
    if(window.confirm("Are you sure you want to reject this application ?")){
      try {
        await adminAxiosInstance.post(`/admin/applications/${applicationId}/reject`);
        toast.success("Application Rejected Successfully")
        fetchApplications(currentPage,searchTerms);
      } catch (error) {
        toast.error('Failed to reject application');
        console.error(error);
      }
    }
  }
  const handleSearchChange=(
    e:React.ChangeEvent<HTMLInputElement>,
    setter:React.Dispatch<React.SetStateAction<string>>
  )=>{
    setter(e.target.value);
    setCurrentPage(1);
  }

  {loading && (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex pt-16 min-h-[calc(100vh-4rem)]">
        <div className="hidden lg:block w-64 flex-shrink-0"></div>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-full mx-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Doctor Applications</h2>
            <div className='mb-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label htmlFor="" className='block text-sm font-medium text-gray-700 mb-2'>
                  Search by Name, Email, or Specialization
                </label>
                  <input type="text" 
                  value={searchTerms}
                  onChange={(e)=>{
                    setSearchTerms(e.target.value);
                    setCurrentPage(1)
                  }}
                  placeholder='Type to search...'
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
             

            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Specialization</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b">
                      <td className="py-3 px-4">{app.name}</td>
                      <td className="py-3 px-4">{app.email}</td>
                      <td className="py-3 px-4">{app.specialization?.name || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => handleViewDetails(app)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={app.status === 'approved'}
                          className={`mr-3 ${
                            app.status === 'approved'
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          Approve
                        </button>
                         <button
                          onClick={() => handleReject(app.id)}
                          disabled={app.status === 'rejected'}
                          className={`${
                            app.status === 'rejected'
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-800'
                          }`}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-center mt-6 space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            {isModalOpen && selectedApplication && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y Missouri:1
                  overflow-y-auto">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-medium text-gray-900">
                      Application Details
                    </h3>
                    <button
                      onClick={closeModal}
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                    >
                      <span className="sr-only">Close</span>
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="px-6 py-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedApplication.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedApplication.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedApplication.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Registration Number
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedApplication.registerNo}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Specialization
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedApplication.specialization?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Experience</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedApplication.experience} years
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Licensed State
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedApplication.licensedState}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <p className="mt-1 text-sm text-gray-900">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              selectedApplication.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : selectedApplication.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {selectedApplication.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Languages</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selectedApplication.languages?.map((lang) => (
                          <span
                            key={lang}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Submitted On</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedApplication.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Updated</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedApplication.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">ID Proof</p>
                        <button
                          onClick={() => handleViewDocument(selectedApplication.idProof)}
                          className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          View ID Proof
                        </button>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Resume</p>
                        <button
                          onClick={() => handleViewDocument(selectedApplication.resume)}
                          className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          View Resume
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          // handleApprove(selectedApplication.id);
                          closeModal();
                        }}
                        disabled={selectedApplication.status === 'approved'}
                        className={`px-4 py-2 rounded-md ${
                          selectedApplication.status === 'approved'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          // handleReject(selectedApplication.id);
                          closeModal();
                        }}
                        disabled={selectedApplication.status === 'rejected'}
                        className={`px-4 py-2 rounded-md ${
                          selectedApplication.status === 'rejected'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        Reject
                      </button>
                      <button
                        onClick={closeModal}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;