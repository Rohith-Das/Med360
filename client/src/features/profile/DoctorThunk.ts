import { createAsyncThunk, isRejectedWithValue } from "@reduxjs/toolkit";
import doctorAxiosInstance from "@/api/doctorAxiosInstance";

export const fetchDoctorProfile=createAsyncThunk(
    "doctorProfile/fetchProfile",
    async(_,{rejectWithValue})=>{
        try {
            const response=await doctorAxiosInstance.get('/doctor/profile');
            return response.data.data;
        } catch (error:any) {
            return rejectWithValue(error.response?.data?.message || "failed profile from thunk")
        }
    }
)