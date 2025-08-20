import { createSlice,PayloadAction } from "@reduxjs/toolkit";
import {
  bookAppointment,
  cancelAppointment,
  getMyAppointments,
  getUpcomingAppointments,
  getAppointmentDetails
} from "./appointmentThunk";

interface Appointment {
  id: string;
  _id?: string;
  patientId: any;
  doctorId: any;
  scheduleId: string;
  timeSlotId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  consultationFee: number;
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  cancelledBy?: 'patient' | 'doctor';
  cancellationReason?: string;
}

interface AppointmentState {
  appointments: Appointment[];
  upcomingAppointments: Appointment[];
  currentAppointment: Appointment | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AppointmentState = {
  appointments: [],
  upcomingAppointments: [],
  currentAppointment: null,
  status: "idle",
  error: null,
};

const appointmentSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAppointment: (state) => {
      state.currentAppointment = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Book Appointment
      .addCase(bookAppointment.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(bookAppointment.fulfilled, (state, action: PayloadAction<Appointment>) => {
        state.status = "succeeded";
        state.appointments.unshift(action.payload);
        state.upcomingAppointments.unshift(action.payload);
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to book appointment";
      })
      
      // Cancel Appointment
      .addCase(cancelAppointment.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action: PayloadAction<Appointment>) => {
        state.status = "succeeded";
        const appointmentId = action.payload.id;
        
        // Update in appointments list
        const appointmentIndex = state.appointments.findIndex(apt => apt.id === appointmentId);
        if (appointmentIndex !== -1) {
          state.appointments[appointmentIndex] = action.payload;
        }
        
        // Remove from upcoming appointments if cancelled
        state.upcomingAppointments = state.upcomingAppointments.filter(apt => apt.id !== appointmentId);
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to cancel appointment";
      })
      
      // Get My Appointments
      .addCase(getMyAppointments.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getMyAppointments.fulfilled, (state, action: PayloadAction<Appointment[]>) => {
        state.status = "succeeded";
        state.appointments = action.payload;
      })
      .addCase(getMyAppointments.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch appointments";
      })
      
      // Get Upcoming Appointments
      .addCase(getUpcomingAppointments.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getUpcomingAppointments.fulfilled, (state, action: PayloadAction<Appointment[]>) => {
        state.status = "succeeded";
        state.upcomingAppointments = action.payload;
      })
      .addCase(getUpcomingAppointments.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch upcoming appointments";
      })
      
      // Get Appointment Details
      .addCase(getAppointmentDetails.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getAppointmentDetails.fulfilled, (state, action: PayloadAction<Appointment>) => {
        state.status = "succeeded";
        state.currentAppointment = action.payload;
      })
      .addCase(getAppointmentDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch appointment details";
      });
  },
});

export const { clearError, clearCurrentAppointment } = appointmentSlice.actions;
export default appointmentSlice.reducer;