import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5001/api/",
  withCredentials: true,
});

export const doctorLoginUser=createAsyncThunk(
    "doctorAuth/login",
    async({email,password}:{email:string;password:string})=>{
        const res=await axiosInstance.post('/doctor/login',{email,password});
        return res.data.data
    }
)
export const doctorRefreshToken = createAsyncThunk(
  "doctorAuth/refreshToken",
  async () => {
    const res = await axiosInstance.post("/doctor/refresh-token");
    return res.data.data;
  }
);