import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getDoctors, getDoctorsBySpecialization,getDoctorSchedules } from "./doctorThunk";
import { createTimeSlot,cancelTimeSlot,getTimeSlots } from "./TimeSlotThunk";
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
  age?:number
  gender?:string;
}

interface TimeSlot {
  id: string;
  _id?:string;
  doctorId: string;
  scheduleId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isActive: boolean;
}
interface DoctorsState {
  doctors: Doctor[];
  timeSlots: TimeSlot[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: DoctorsState = {
  doctors: [],
  timeSlots: [],
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
      })
      .addCase(getDoctorsBySpecialization.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getDoctorsBySpecialization.fulfilled, (state, action: PayloadAction<Doctor[]>) => {
        state.status = "succeeded";
        state.doctors = action.payload;
      })
      .addCase(getDoctorsBySpecialization.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch doctors by specialization";
      })
      .addCase(createTimeSlot.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createTimeSlot.fulfilled, (state, action) => {
        state.status = "idle";
        state.timeSlots.push(action.payload);
      })
      .addCase(createTimeSlot.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to create time slot";
      })
      .addCase(getTimeSlots.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getTimeSlots.fulfilled, (state, action) => {
        state.status = "idle";
        state.timeSlots = action.payload;
      })
      .addCase(getTimeSlots.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch time slots";
      })
     .addCase(cancelTimeSlot.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "idle";
        state.timeSlots = state.timeSlots.filter((slot) => slot.id !== action.payload);
      })
      .addCase(cancelTimeSlot.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to cancel time slot";
      })
        .addCase(getDoctorSchedules.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getDoctorSchedules.fulfilled, (state, action: PayloadAction<TimeSlot[]>) => {
        state.status = "succeeded";
        state.timeSlots = action.payload;
      })
      .addCase(getDoctorSchedules.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch doctor schedules";
      })

  },
});

export default doctorsSlice.reducer;