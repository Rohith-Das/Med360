// src/services/videoCallService.ts
import axiosInstance from "@/api/axiosInstance";


export interface VideoCallSession {
  roomId: string;
  appointmentId: string;
  status: 'waiting' | 'active' | 'ended';
}

export class VideoCallService {
  
  static async initiateCall(appointmentId: string): Promise<VideoCallSession> {
    try {
      const response = await axiosInstance.post('/video-call/initiate', {
        appointmentId
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to initiate call');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to initiate call');
    }
  }

  static async joinCall(roomId: string): Promise<VideoCallSession> {
    try {
      const response = await axiosInstance.post(`/video-call/join/${roomId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to join call');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to join call');
    }
  }

  static async endCall(roomId: string): Promise<boolean> {
    try {
      const response = await axiosInstance.post(`/video-call/end/${roomId}`);
      
      if (response.data.success) {
        return response.data.data.ended;
      } else {
        throw new Error(response.data.message || 'Failed to end call');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to end call');
    }
  }

  static async getCallStatus(roomId: string): Promise<VideoCallSession> {
    try {
      const response = await axiosInstance.get(`/video-call/status/${roomId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get call status');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get call status');
    }
  }

  // For doctor-specific endpoints
  static async initiateDoctorCall(appointmentId: string): Promise<VideoCallSession> {
    try {
      const response = await axiosInstance.post('/video-call/doctor/initiate', {
        appointmentId
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to initiate call');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to initiate call');
    }
  }

  static async joinDoctorCall(roomId: string): Promise<VideoCallSession> {
    try {
      const response = await axiosInstance.post(`/video-call/doctor/join/${roomId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to join call');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to join call');
    }
  }

  static async endDoctorCall(roomId: string): Promise<boolean> {
    try {
      const response = await axiosInstance.post(`/video-call/doctor/end/${roomId}`);
      
      if (response.data.success) {
        return response.data.data.ended;
      } else {
        throw new Error(response.data.message || 'Failed to end call');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to end call');
    }
  }

  static async getDoctorCallStatus(roomId: string): Promise<VideoCallSession> {
    try {
      const response = await axiosInstance.get(`/video-call/doctor/status/${roomId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get call status');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get call status');
    }
  }
}