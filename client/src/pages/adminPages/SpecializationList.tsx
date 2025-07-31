// client/src/pages/adminPages/SpecializationList.tsx
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchSpecializations, deleteSpecialization } from '@/features/specialization/specializationSlice';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminNavbar from '@/components/admin/adminNavbar';

const SpecializationList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { specializations, loading, error } = useAppSelector(state => state.specialization);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSpecializations());
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this specialization?')) {
      try {
        await dispatch(deleteSpecialization(id)).unwrap();
        toast.success('Specialization deleted successfully');
      } catch (err) {
        toast.error('Failed to delete specialization');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      
      <div className="flex pt-16 min-h-[calc(100vh-4rem)]">
        {/* Sidebar would go here */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Specializations</h1>
            <Link 
              to="/admin/specializations/create" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add New
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {specializations.map((spec) => (
                  <tr key={spec.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img src={spec.imageUrl} alt={spec.name} className="h-10 w-10 rounded-full object-cover" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{spec.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{spec.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        to={`/admin/specializations/edit/${spec.id}`} 
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(spec.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default SpecializationList;