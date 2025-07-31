// client/src/pages/adminPages/SpecializationForm.tsx
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { createSpecialization, updateSpecialization, fetchSpecializations } from '@/features/specialization/specializationSlice';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminNavbar from '@/components/admin/adminNavbar';


const SpecializationForm: React.FC = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { specializations } = useAppSelector(state => state.specialization);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null as File | null,
    imagePreview: ''
  });

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      const spec = specializations.find(s => s.id === id);
      if (spec) {
        setFormData({
          name: spec.name,
          description: spec.description,
          image: null,
          imagePreview: spec.imageUrl
        });
      }
    }
  }, [id, isEditMode, specializations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);

    console.log('Form data before submission:', {
  name: formData.name,
  description: formData.description,
  hasImage: !!formData.image
});

// Log FormData contents
for (let [key, value] of formDataToSend.entries()) {
  console.log(key, value);
}

    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      if (isEditMode && id) {
        await dispatch(updateSpecialization({ id, data: formDataToSend })).unwrap();
        toast.success('Specialization updated successfully');
      } else {
        await dispatch(createSpecialization(formDataToSend)).unwrap();
        toast.success('Specialization created successfully');
      }
      navigate('/admin/specializations');
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* <AdminNavbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} /> */}
      
      <div className="flex pt-16 min-h-[calc(100vh-4rem)]">
        {/* Sidebar would go here */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">
              {isEditMode ? 'Edit Specialization' : 'Add New Specialization'}
            </h1>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={4}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {formData.imagePreview && (
                  <div className="mt-2">
                    <img 
                      src={formData.imagePreview} 
                      alt="Preview" 
                      className="h-32 w-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/admin/specializations')}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {isEditMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default SpecializationForm;