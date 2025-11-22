// client/src/pages/patientPages/PatientProfile.tsx
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchProfile, updateProfile } from '@/features/profile/profileThunks';
import { logout } from '@/features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { toast ,ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '@/components/patient/Navbar';
import { uploadProfilePicture,removeProfilePicture } from '@/features/profile/profileThunks';


  type Gender = 'male' | 'female' | '';

interface ProfileFormData {
  name: string;
  mobile: string;
  gender: Gender;
  dateOfBirth: string;
  address: string;
  profilePicture?: string;
}
const ProfilePage = () => {



  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: profile, loading, error } = useAppSelector((state) => state.patientAuth.profile);
  const { patient } = useAppSelector((state) => state.patientAuth.auth);
  
  const [isEditing, setIsEditing] = useState(false);
 const [formData, setFormData] = useState<ProfileFormData>({
  name: '',
  mobile: '',
  gender: '',
  dateOfBirth: '',
  address: '',
});
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

 useEffect(() => {
  if (profile) {
    setFormData({
      name: profile.name,
      mobile: profile.mobile,
      gender: (profile.gender as Gender) || '',
      dateOfBirth: profile.dateOfBirth || '',
      address: profile.address || '',
    });
  }
}, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (loading && !profile) return <div className="text-center py-8">Loading profile...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        await dispatch(uploadProfilePicture(e.target.files[0])).unwrap();
        toast.success('Profile picture updated successfully!');
      } catch (error) {
        toast.error('Failed to update profile picture');
      }
    }
  };
  const handleRemovePicture = async () => {
    try {
      await dispatch(removeProfilePicture()).unwrap();
      toast.success('Profile picture removed successfully!');
    } catch (error) {
      toast.error('Failed to remove profile picture');
    }
  };

  return (
    <>
      <Navbar/>
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    
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
    />
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-4">
            <div className="flex items-center mb-6">
    <div className="relative">
      {profile?.profilePicture ? (
        <>
          <img 
            src={profile.profilePicture} 
            alt="Profile" 
            className="w-16 h-16 rounded-full object-cover"
          />
          {isEditing && (
            <button
              onClick={handleRemovePicture}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              title="Remove profile picture"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </>
      ) : (
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
          {patient?.name?.charAt(0).toUpperCase()}
        </div>
      )}
      {isEditing && (
        <div className="mt-2">
          <label className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium">
            <span>{profile?.profilePicture ? 'Change' : 'Upload'} picture</span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
    <div className="ml-4">
      <h2 className="text-xl font-semibold">{patient?.name}</h2>
      <p className="text-gray-600">{patient?.email}</p>
    </div>
  </div>

            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
  name="gender"
  value={formData.gender}
  onChange={handleInputChange}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
>
  <option value="">Select Gender</option>
  <option value="male">Male</option>
  <option value="female">Female</option>
</select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                    <p className="mt-1 text-sm text-gray-900">{profile?.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-sm text-gray-900">{profile?.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Mobile</h3>
                    <p className="mt-1 text-sm text-gray-900">{profile?.mobile}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                    <p className="mt-1 text-sm text-gray-900">{profile?.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="mt-1 text-sm text-gray-900">{profile?.address || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ProfilePage;