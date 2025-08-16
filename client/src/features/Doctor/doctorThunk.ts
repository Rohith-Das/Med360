import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";
import doctorAxiosInstance from "@/api/doctorAxiosInstance";



export const getDoctors=createAsyncThunk(
    'doctors/getDoctors',
    async()=>{
        const res=await doctorAxiosInstance.get('/doctor/all');
        return res.data.data
    }
)
export const getDoctorsBySpecialization = createAsyncThunk(
  "doctors/getDoctorsBySpecialization",
  async (specializationId: string) => {
    try {
      const res = await doctorAxiosInstance.get(`/doctor/specialization/${specializationId}`);
      return res.data.data;
    } catch (error: any) {
      console.error('Get doctors by specialization error:', error);
      throw error;
    }
  }
);