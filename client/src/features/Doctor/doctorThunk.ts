import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

export const getDoctors=createAsyncThunk(
    'doctors/getDoctors',
    async()=>{
        const res=await axiosInstance.get('/doctor/all');
        return res.data.data
    }
)