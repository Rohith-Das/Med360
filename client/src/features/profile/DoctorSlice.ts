import { createSlice } from "@reduxjs/toolkit";
import { fetchDoctorProfile } from "./DoctorThunk";

export interface Doctor {
  id?: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  registerNo: string;
  specialization: string; 
  experience: number;
  languages: string[];
  licensedState: string;
  profileImage?: string;
  isBlocked?: boolean;
  dateOfBirth?: string; 
  education?: string;
   loading: boolean;
  error: string | null;
//   consultationFee?: number;
//   createdAt?: string;
//   updatedAt?: string;
//   idProof: string;
//   resume: string;
//   refreshToken?: string;
//   refreshTokenExpiresAt?: string;
}

interface DoctorProfileState {
  profile: Doctor | null;
  loading: boolean;
  error: string | null;
}

const initialState: DoctorProfileState = {
  profile: null,
  loading: false,
  error: null
};

const DoctorProfileSlice=createSlice({
    name:'doctorProfile',
    initialState,
    reducers:{
        clearDoctorprofile:(state)=>{
            state.profile=null
            state.error=null;
        },
    },
    extraReducers:(builder)=>{
        builder
        .addCase(fetchDoctorProfile.pending,(state)=>{
            state.loading=true;
            state.error=null;
        })
        .addCase(fetchDoctorProfile.fulfilled,(state,action)=>{
            state.loading=false;
            state.profile=action.payload;
        })
        .addCase(fetchDoctorProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch profile";
         })
    }
})
export const {clearDoctorprofile}=DoctorProfileSlice.actions;
export default DoctorProfileSlice.reducer;