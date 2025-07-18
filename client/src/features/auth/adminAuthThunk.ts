import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const axiosInstance=axios.create({
    baseURL: "http://localhost:5001/api/",
  withCredentials: true,
})

export const adminLoginUser=createAsyncThunk(
    "adminAuth/login",
    async({email,password}:{email:string;password:string})=>{
        const res=await axiosInstance.post("/admin/login",{email,password});
        return res.data.data
    }
)
export const adminRefreshToken=createAsyncThunk(
    "adminAuth/refreshToken",
    async()=>{
        const res=axiosInstance.post("/admin/refresh-token");
        return (await res).data.data
    }
)