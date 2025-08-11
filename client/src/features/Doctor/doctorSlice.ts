import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getDoctors } from "./doctorThunk";

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: { name: string; imageUrl: string };
  experience: number;
  languages: string[];
  licensedState: string;
  profileImage?: string;
  consultationFee: number;
}

interface DoctorsState {
  doctors: Doctor[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: DoctorsState = {
  doctors: [],
  status: "idle",
  error: null,
};

const doctorsSlice = createSlice({
  name: "doctors",
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
      });
  },
});

export default doctorsSlice.reducer;