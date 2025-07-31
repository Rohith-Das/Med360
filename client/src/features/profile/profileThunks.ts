import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/patient/profile');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

type Gender = 'male' | 'female' | '';

interface ProfileFormData {
  name: string;
  mobile: string;
  gender: Gender;
  dateOfBirth: string;
  address: string;
}
export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (profileData: ProfileFormData) => {
    // Convert empty gender to undefined
    const dataToSend = {
      ...profileData,
      gender: profileData.gender || undefined,
      dateOfBirth: profileData.dateOfBirth || undefined,
      address: profileData.address || undefined,
    };
    
    const response = await axiosInstance.put('/patient/profile', dataToSend);
    return response.data.data;
  }
);

export const uploadProfilePicture=createAsyncThunk(
    "profile/uploadProfilePicture",
    async(file:File,{rejectWithValue})=>{
        try {
            const formData=new FormData();
            formData.append('profilePicture',file);
            const response=await axiosInstance.post('/patient/profile/picture',formData,{
                headers:{
                    'Content-Type': 'multipart/form-data'
                }
            })
            return response.data.data;
        } catch (error:any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to upload profile picture');
        }
    }
    
)


export const removeProfilePicture = createAsyncThunk(
  "profile/removeProfilePicture",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete('/patient/profile/picture');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove profile picture');
    }
  }
);