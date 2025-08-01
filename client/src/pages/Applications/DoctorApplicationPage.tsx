// src/pages/doctorPages/DoctorApplicationPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Application_BASE_URL, { API_ENDPOINTS } from '@/api/ApplicationApi';


interface Specialization {
  _id: string;
  name: string;
  description?: string;
}

interface ApplicationFormData {
  name: string;
  email: string;
  phone: string;
  registerNo: string;
  experience: string;
  languages: string[];
  specializationId: string;
  licensedState: string;
  idProof: File | null;
  resume: File | null;
}

const DoctorApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    name: '',
    email: '',
    phone: '',
    registerNo: '',
    experience: '',
    languages: [],
    specializationId: '',
    licensedState: '',
    idProof: null,
    resume: null
  });

  const [languageInput, setLanguageInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const commonLanguages = [
    'English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 
    'Bengali', 'Gujarati', 'Marathi', 'Punjabi', 'Urdu'
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 'Andaman and Nicobar Islands'
  ];

  useEffect(() => {
    fetchSpecializations();
  }, []);

  const fetchSpecializations = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.SPECIALIZATIONS);
      const data = await response.json();
      
      if (data.success) {
        setSpecializations(data.data);
      } else {
        setError('Failed to fetch specializations');
      }
    } catch (err) {
      setError('Error fetching specializations');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [name]: 'File size must be less than 10MB'
        }));
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif'
      ];

      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Only PDF, DOC, DOCX, and image files are allowed'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        [name]: file
      }));

      // Clear error
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  const addLanguage = (language: string) => {
    if (language && !formData.languages.includes(language)) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, language]
      }));
    }
    setLanguageInput('');
  };

  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== language)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Invalid Indian phone number';
    
    if (!formData.registerNo.trim()) newErrors.registerNo = 'Registration number is required';
    if (!formData.experience.trim()) newErrors.experience = 'Experience is required';
    else if (isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
      newErrors.experience = 'Experience must be a valid positive number';
    }
    
    if (formData.languages.length === 0) newErrors.languages = 'At least one language is required';
    if (!formData.specializationId) newErrors.specializationId = 'Specialization is required';
    if (!formData.licensedState) newErrors.licensedState = 'Licensed state is required';
    if (!formData.idProof) newErrors.idProof = 'ID proof is required';
    if (!formData.resume) newErrors.resume = 'Resume is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitLoading(true);
      setError('');
      setSuccess('');

      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('registerNo', formData.registerNo);
      submitData.append('experience', formData.experience);
      submitData.append('languages', JSON.stringify(formData.languages));
      submitData.append('specializationId', formData.specializationId);
      submitData.append('licensedState', formData.licensedState);
      
      if (formData.idProof) submitData.append('idProof', formData.idProof);
      if (formData.resume) submitData.append('resume', formData.resume);

      const response = await fetch(API_ENDPOINTS.SUBMIT_APPLICATION, {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          registerNo: '',
          experience: '',
          languages: [],
          specializationId: '',
          licensedState: '',
          idProof: null,
          resume: null
        });
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Become a Doctor - Application Form</h1>
            <p className="text-blue-100 mt-1">Please fill in all the required information to submit your application</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter 10-digit phone number"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Registration Number *
                </label>
                <input
                  type="text"
                  name="registerNo"
                  value={formData.registerNo}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.registerNo ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your medical registration number"
                />
                {errors.registerNo && <p className="text-red-500 text-sm mt-1">{errors.registerNo}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.experience ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter years of experience"
                />
                {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Licensed State *
                </label>
                <select
                  name="licensedState"
                  value={formData.licensedState}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.licensedState ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select your licensed state</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.licensedState && <p className="text-red-500 text-sm mt-1">{errors.licensedState}</p>}
              </div>
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization *
              </label>
              <select
                name="specializationId"
                value={formData.specializationId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.specializationId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">Select your specialization</option>
                {specializations.map(spec => (
                  <option key={spec._id} value={spec._id}>{spec.name}</option>
                ))}
              </select>
              {errors.specializationId && <p className="text-red-500 text-sm mt-1">{errors.specializationId}</p>}
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages Spoken *
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.languages.map(language => (
                  <span
                    key={language}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {language}
                    <button
                      type="button"
                      onClick={() => removeLanguage(language)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  placeholder="Type a language and press Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLanguage(languageInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addLanguage(languageInput)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {commonLanguages.map(language => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => addLanguage(language)}
                    disabled={formData.languages.includes(language)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      formData.languages.includes(language)
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
              {errors.languages && <p className="text-red-500 text-sm mt-1">{errors.languages}</p>}
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Proof *
                </label>
                <input
                  type="file"
                  name="idProof"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.idProof ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, or image files (max 10MB)</p>
                {errors.idProof && <p className="text-red-500 text-sm mt-1">{errors.idProof}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume/CV *
                </label>
                <input
                  type="file"
                  name="resume"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.resume ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, or image files (max 10MB)</p>
                {errors.resume && <p className="text-red-500 text-sm mt-1">{errors.resume}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className={`px-6 py-2 rounded-md text-white font-medium ${
                  submitLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorApplicationPage;