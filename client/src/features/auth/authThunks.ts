import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5001/api/",
  withCredentials: true,
});

export const loginUser=createAsyncThunk(
    "auth/login",
    async({email,password}:{email:string;password:string})=>{
        const res=await axiosInstance.post("/patient/login",{email,password});
        return res.data.data;
    }
)

export const refreshToken=createAsyncThunk(
    "auth/refreshToken",async ()=>{
        const res=await axiosInstance.post('/patient/refresh-token');
        return res.data.data;
    }
)
export const registerUser =createAsyncThunk(
    "auth/register",
      async ({ name, email, mobile, password }: { name: string; email: string; mobile: string; password: string })=>{
        const res=await axiosInstance.post('/patient/register',{name,email,mobile,password})
        return res.data.data
      } 
)
