import { createAsyncThunk } from "@reduxjs/toolkit";
import doctorAxiosInstance from "@/api/doctorAxiosInstance";
import { json } from "stream/consumers";

const getDoctorFromAuth=()=>{
    const token=localStorage.getItem('doctorAccessToken')
    console.log('get doctorid from get doctorid auth ', token);
    if(token){
       const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId;
    }
    throw new Error("Doctor ID not found");
}

export const createTimeSlot = createAsyncThunk(
  'doctors/createTimeSlot',
  async (timeSlotData: { date: string; timeSlots: { startTime: string; endTime: string }[] }) => {
    const res = await doctorAxiosInstance.post('/schedules', timeSlotData);
    return res.data.data;
  }
);
export const getTimeSlots = createAsyncThunk("doctors/getTimeSlots", async () => {
  const doctorId = getDoctorFromAuth();
    const res = await doctorAxiosInstance.get(`/schedules/doctor/${doctorId}`);
    // console.log('API response:', res.data);
    const schedules=res.data.data ||[];
    const allTimeSlots=schedules.flatMap((sh:any)=>
    sh.timeSlots?.map((slot:any)=>({
        id:slot._id || slot.id ,
        date:sh.date,
        startTime:slot.startTime,
        endTime:slot.endTime,
        isBooked:slot.isBooked||false,
         isActive: slot.isActive !== false,
         scheduleId: sh._id.toString()
    })) ||[]).filter((slot:any)=>slot.isActive)
    
  return allTimeSlots
});

export const cancelTimeSlot = createAsyncThunk(
  "doctors/cancelTimeSlot",
  async ({ scheduleId, timeSlotId }: { scheduleId: string; timeSlotId: string }) => {
    await doctorAxiosInstance.patch(`/schedules/${scheduleId}/time-slots/${timeSlotId}/cancel`);
    return timeSlotId; 
  }
);