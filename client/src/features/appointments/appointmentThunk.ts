// src/features/appointments/appointmentThunk.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

export interface BookAppointmentData {
  doctorId: string;
  scheduleId: string;
  timeSlotId: string;
  reason?: string;
}

export interface CancelAppointmentData {
  appointmentId: string;
  cancellationReason?: string;
}

export const bookAppointment = createAsyncThunk(
  'appointments/bookAppointment',
  async (appointmentData: BookAppointmentData) => {
    try {
      const res = await axiosInstance.post('/appointments/book', appointmentData);
      return res.data.data;
    } catch (error: any) {
      console.error('Book appointment error:', error);
      throw error;
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async (cancelData: CancelAppointmentData) => {
    try {
      const res = await axiosInstance.patch(`/appointments/${cancelData.appointmentId}/cancel`, {
        cancellationReason: cancelData.cancellationReason
      });
      return res.data.data;
    } catch (error: any) {
      console.error('Cancel appointment error:', error);
      throw error;
    }
  }
);

export const getMyAppointments = createAsyncThunk(
  'appointments/getMyAppointments',
  async (status?: string[]) => {
    try {
      const statusQuery = status && status.length > 0 ? `?status=${status.join(',')}` : '';
      const res = await axiosInstance.get(`/appointments/my-appointments${statusQuery}`);
      return res.data.data;
    } catch (error: any) {
      console.error('Get my appointments error:', error);
      throw error;
    }
  }
);

export const getUpcomingAppointments = createAsyncThunk(
  'appointments/getUpcomingAppointments',
  async () => {
    try {
      const res = await axiosInstance.get('/appointments/upcoming');
      return res.data.data;
    } catch (error: any) {
      console.error('Get upcoming appointments error:', error);
      throw error;
    }
  }
);

export const getAppointmentDetails = createAsyncThunk(
  'appointments/getAppointmentDetails',
  async (appointmentId: string) => {
    try {
      const res = await axiosInstance.get(`/appointments/${appointmentId}`);
      return res.data.data;
    } catch (error: any) {
      console.error('Get appointment details error:', error);
      throw error;
    }
  }
);

export const getDoctorScheduleForPatient = createAsyncThunk(
  "doctors/getDoctorScheduleForPatient",
  async (doctorId: string) => {
    try {
      const res = await axiosInstance.get(`/schedules/doctor/${doctorId}`);
      const schedules = res.data.data || [];
      
      // Transform schedules to include only available time slots
      const availableSchedules = schedules.map((schedule: any) => ({
        ...schedule,
        timeSlots: schedule.timeSlots?.filter((slot: any) => 
          slot.isActive && !slot.isBooked
        ) || []
      })).filter((schedule: any) => 
        // Only include schedules that have available slots and are in the future
        schedule.timeSlots.length > 0 && new Date(schedule.date) >= new Date()
      );
      
      return availableSchedules;
    } catch (error: any) {
      console.error('Get doctor schedule for patient error:', error);
      throw error;
    }
  }
);