import { createSlice ,PayloadAction } from "@reduxjs/toolkit";
import { getDoctors,unblockDoctor,blockDoctor,updateDoctor } from "./DoctorMgtThunk";

interface Doctor {
 _id: string;
  name: string;
  email: string;
  phone: string;
  registerNo: string;
  specialization: { name: string };
  experience: number;
  languages: string[];
  licensedState: string;
  profileImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  isBlocked: boolean;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  education?: string;
  consultationFee?: number;
}

interface AdminDoctorsState {
  doctors: Doctor[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AdminDoctorsState = {
  doctors: [],
  status: "idle",
  error: null,
};


const adminDoctorsSlice = createSlice({
  name: "adminDoctors",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDoctors.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getDoctors.fulfilled, (state, action: PayloadAction<Doctor[]>) => {
        state.status = "succeeded";
        state.doctors = action.payload;
      })
      .addCase(getDoctors.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch doctors";
      })
      .addCase(updateDoctor.fulfilled, (state, action: PayloadAction<Doctor>) => {
        state.status = "succeeded";
        const index = state.doctors.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) {
          state.doctors[index] = action.payload;
        }
      })
      .addCase(updateDoctor.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to update doctor";
      })
      .addCase(blockDoctor.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        const doctor = state.doctors.find((d) => d._id === action.payload);
        if (doctor) {
          doctor.isBlocked = true;
        }
      })
      .addCase(blockDoctor.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to block doctor";
      })
      .addCase(unblockDoctor.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        const doctor = state.doctors.find((d) => d._id === action.payload);
        if (doctor) {
          doctor.isBlocked = false;
        }
      })
      .addCase(unblockDoctor.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to unblock doctor";
      });
  },
});

export default adminDoctorsSlice.reducer;