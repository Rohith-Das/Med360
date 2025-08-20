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

export const getDoctorSchedules = createAsyncThunk(
  "doctors/getDoctorSchedules",
  async (doctorId: string) => {
    try {
      const res = await axiosInstance.get(`/schedules/doctor/${doctorId}`);
      const schedules = res.data.data || [];
      const allTimeSlots = schedules.flatMap((sh: any) =>
        sh.timeSlots?.map((slot: any) => ({
          id: slot._id || slot.id,
          date: sh.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: slot.isBooked || false,
          isActive: slot.isActive !== false,
          scheduleId: sh._id.toString()
        })) || []
      ).filter((slot: any) => slot.isActive);
      return allTimeSlots;
    } catch (error: any) {
      console.error('Get doctor schedules error:', error);
      throw error;
    }
  }
);