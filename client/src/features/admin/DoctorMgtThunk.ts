import { createAsyncThunk } from "@reduxjs/toolkit";
import adminAxiosInstance from '@/api/adminAxiosInstance';

export const getDoctors = createAsyncThunk(
  "adminDoctors/getDoctors",
  async () => {
    try {
      const res = await adminAxiosInstance.get("/doctor/all");
      return res.data.data;
    } catch (error: any) {
      console.error('Get doctors error:', error);
      throw error;
    }
  }
);

export const updateDoctor = createAsyncThunk(
  "adminDoctors/updateDoctor",
  async ({ id, data }: { id: string; data: any }) => {
    try {
      console.log('Updating doctor with ID:', id, 'Data:', data);
      if (!id || id === 'undefined') {
        throw new Error('Invalid doctor ID');
      }
      const res = await adminAxiosInstance.put(`/doctor/${id}`, data);
      return res.data.data;
    } catch (error: any) {
      console.error('Update doctor error:', error);
      throw error;
    }
  }
);

export const blockDoctor = createAsyncThunk(
  "adminDoctors/blockDoctor",
  async (id: string) => {
    try {
      console.log('Blocking doctor with ID:', id);
      if (!id || id === 'undefined') {
        throw new Error('Invalid doctor ID');
      }
      const res = await adminAxiosInstance.put(`/doctor/block/${id}`);
      return id;
    } catch (error: any) {
      console.error('Block doctor error:', error);
      throw error;
    }
  }
);

export const unblockDoctor = createAsyncThunk(
  "adminDoctors/unblockDoctor",
  async (id: string) => {
    try {
      console.log('Unblocking doctor with ID:', id);
      if (!id || id === 'undefined') {
        throw new Error('Invalid doctor ID');
      }
      const res = await adminAxiosInstance.put(`/doctor/unblock/${id}`);
      return id;
    } catch (error: any) {
      console.error('Unblock doctor error:', error);
      throw error;
    }
  }
);