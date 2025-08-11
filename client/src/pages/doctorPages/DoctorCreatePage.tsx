import React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminAxiosInstance from '@/api/adminAxiosInstance';
import { Application } from '@/types/application';
import AdminSidebar from '@/components/admin/adminSidebar';
import AdminNavbar from '@/components/admin/adminNavbar';
import { ToastContainer, toast } from 'react-toastify';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchSpecializations } from '@/features/specialization/specializationSlice';

interface Specialization {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

interface DoctorFormData {
  name: string;
  email: string;
  phone: string;
  registerNo: string;
  specializationId: string;
  experience: number;
  languages: string[];
  licensedState: string;
  idProof: string;
  resume: string;
  gender: 'male' | 'female' | 'other' | '';
  dateOfBirth: string;
  education: string;
  consultationFee: number;
  profileImage?: File;
}

function DoctorCreatePage() {
  const dispatch = useAppDispatch();
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<DoctorFormData>({
    name: '',
    email: '',
    phone: '',
    registerNo: '',
    specializationId: '',
    experience: 0,
    languages: [],
    licensedState: '',
    idProof: '',
    resume: '',
    gender: '',
    dateOfBirth: '',
    education: '',
    consultationFee: 0,
    profileImage: undefined,
  });
  const { specializations } = useAppSelector((state) => state.specialization);

  useEffect(() => {
    dispatch(fetchSpecializations()); // Fetch specializations
    const fetchApplication = async () => {
      try {
        const response = await adminAxiosInstance.get(`/admin/applications/${applicationId}`);
        const app: Application = response.data.data;
        setFormData({
          name: app.name,
          email: app.email,
          phone: app.phone,
          registerNo: app.registerNo,
          specializationId: app.specialization?.id || '', // Use ObjectId
          experience: app.experience,
          languages: app.languages,
          licensedState: app.licensedState,
          idProof: app.idProof,
          resume: app.resume,
          gender: '',
          dateOfBirth: '',
          education: '',
          consultationFee: 0,
        });
      } catch (err) {
        setError('Failed to fetch application data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId, dispatch]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'consultationFee' ? parseFloat(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profileImage: file }));
    }
  };

  const handleLanguagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const languages = e.target.value.split(',').map((lang) => lang.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, languages }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting doctor payload:', formData);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'languages') {
          data.append(key, JSON.stringify(value));
        } else if (key === 'profileImage' && value) {
          data.append(key, value);
        } else if (value !== undefined && value !== '') {
          data.append(key, value.toString());
        }
      });
      console.log('Submitting doctor payload:', formData);
      await adminAxiosInstance.post(`/admin/doctors/create-from-application/${applicationId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Doctor created successfully');
      navigate('/admin/applications');
    } catch (err) {
      toast.error('Failed to create doctor');
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex pt-16 min-h-[calc(100vh-4rem)]">
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Create Doctor</h1>
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                <input
                  type="text"
                  name="registerNo"
                  value={formData.registerNo}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                <select
                  name="specializationId"
                  value={formData.specializationId}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select Specialization</option>
                  {specializations.map((spec: Specialization) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Languages (Comma-separated)</label>
                <input
                  type="text"
                  name="languages"
                  value={formData.languages.join(', ')}
                  onChange={handleLanguagesChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Licensed State</label>
                <input
                  type="text"
                  name="licensedState"
                  value={formData.licensedState}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Education</label>
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Consultation Fee</label>
                <input
                  type="number"
                  name="consultationFee"
                  value={formData.consultationFee || ''}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm font-medium text-gray-500">ID Proof</p>
                <a
                  href={formData.idProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  View ID Proof
                </a>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Resume</p>
                <a
                  href={formData.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  View Resume
                </a>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin/applications')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Doctor
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default DoctorCreatePage;