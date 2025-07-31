import { json } from "stream/consumers";
import {  loginUser, refreshToken } from "./authThunks";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { stat } from "fs";



export interface Patient {
  id: string;
  name: string;
  email: string;
  mobile: string;
  gender?: 'male' | 'female';
  dateOfBirth?: string;
 address?:string;
  profilePicture?: string;
  isVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}
export interface AuthState {
  patient: Patient | null;
  accessToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;

}

const initialState: AuthState = {
  patient: null,
  accessToken:null,
  status: "idle",
  error: null,
 
};



const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.patient = null;
      state.accessToken = null;
      state.status = "idle";
      state.error = null;
      
      localStorage.removeItem("accessToken"); 
     
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    clearErrors:(state)=>{
      state.error=null;
     
    },

   
    
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error=null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.patient = action.payload.patient;
        state.accessToken = action.payload.accessToken;
        localStorage.setItem("accessToken", action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Login failed";
      })
      .addCase(refreshToken.pending,(state)=>{
        state.error=null
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        //update
         localStorage.setItem("accessToken", action.payload.accessToken);
      })
      .addCase(refreshToken.rejected,(state,action)=>{
        state.error=action.error.message || "token refresh failed"
      })
   
   
      
    
  },
});

export const { logout, setAccessToken ,clearErrors} = authSlice.actions;
export default authSlice.reducer;
