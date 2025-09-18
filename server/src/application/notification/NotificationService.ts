import { container, inject, injectable } from "tsyringe";
import { CreateNotificationUC } from "./CreateNotificationUC";
import { IPatientRepository } from "../../domain/repositories/patientRepository_method";
import { IDoctorRepository } from "../../domain/repositories/DoctorRepository-method";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { getSocketServer } from "../../infrastructure/socket/socketServer";

export interface AppointmentNotificationData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentData: string;
  appointmentTime: string;
  consultingFee: number;
  type: 'booked' | 'cancelled' | 'confirm';
  cancelReason?: string;
  refundAmount?: number;
}

export interface VideoCallNotificationData {
  appointmentId: string;
  initiatorId: string;
  initiatorRole: 'doctor' | 'patient';
  recipientId: string;
  roomId: string;
  type: 'video_call_initiated' | 'video_call_ended' | 'call_missed';
  initiatorName?: string;
  title: string;
  message: string;
  data?: any;
  duration?: number;
  callType?: 'video'; 
  appointmentTime?: string;
}

interface ReminderNotificationData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  patientName: string;
}

@injectable()
export class NotificationService {
  constructor(
    private creatNotificationUC: CreateNotificationUC,
    @inject('IPatientRepository') private patientRepo: IPatientRepository,
    @inject('IDoctorRepository') private doctorRepo: IDoctorRepository,
    @inject('IAppointmentRepository') private appointmentRepo: IAppointmentRepository
  ) {}

  async sendAppointmentBookedNotification(data: AppointmentNotificationData): Promise<void> {
    try {
      const patient = await this.patientRepo.findById(data.patientId);
      const doctor = await this.doctorRepo.findById(data.doctorId);

      console.log(`patient&doctor in notificationService${patient},${doctor}`);
      if (!doctor || !patient) {
        throw new Error("patient and doctor not found");
      }

      // Create notification via use case
      const notification = await this.creatNotificationUC.execute({
        recipientId: data.doctorId,
        recipientType: 'doctor',
        senderId: data.patientId,
        senderType: 'patient',
        type: 'appointment_booked',
        title: 'New Appointment Booked',
        message: `${patient.name} has booked an appointment with you`,
        data: {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          patientName: patient.name,
          appointmentDate: data.appointmentData,
          appointmentTime: data.appointmentTime,
          consultationFee: data.consultingFee,
        },
        isRead: false,
        priority: 'high'
      });

      // Send real-time notification via Socket.IO
      this.sendSocketNotification(data.doctorId, 'new_notification', {
        id: notification?.id,
        title: 'New Appointment Booked',
        message: `${patient.name} has booked an appointment with you`,
        type: 'appointment_booked',
        data: {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          patientName: patient.name,
          appointmentDate: data.appointmentData,
          appointmentTime: data.appointmentTime,
          consultationFee: data.consultingFee,
        },
        createdAt: new Date(),
        isRead: false
      });

      console.log(`appointment booked notification send to doctor : ${doctor.name}`);
    } catch (error: any) {
      console.log('send appointment booked notification error', error);
      throw error;
    }
  }

  async sendAppointmentCancelledNotification(data: AppointmentNotificationData): Promise<void> {
    try {
      const patient = await this.patientRepo.findById(data.patientId);
      const doctor = await this.doctorRepo.findById(data.doctorId);

      if (!doctor || !patient) {
        throw new Error('patient and doctor not found');
      }

      // Create notification via use case
      const notification = await this.creatNotificationUC.execute({
        recipientId: data.doctorId,
        recipientType: 'doctor',
        senderId: data.patientId,
        senderType: 'patient',
        type: 'appointment_cancelled',
        title: 'appointment cancelled',
        message: `${patient.name} has cancelled their appointment`,
        data: {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          patientName: patient.name,
          appointmentDate: data.appointmentData,
          appointmentTime: data.appointmentTime,
          consultationFee: data.consultingFee,
          refundAmount: data.refundAmount,
        },
        isRead: false,
        priority: 'medium'
      });

      // Send real-time notification via Socket.IO
      this.sendSocketNotification(data.doctorId, 'new_notification', {
        id: notification?.id,
        title: 'Appointment Cancelled',
        message: `${patient.name} has cancelled their appointment`,
        type: 'appointment_cancelled',
        data: {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          patientName: patient.name,
          appointmentDate: data.appointmentData,
          appointmentTime: data.appointmentTime,
          consultationFee: data.consultingFee,
          refundAmount: data.refundAmount,
        },
        createdAt: new Date(),
        isRead: false
      });

      console.log(`Appointment cancelled notification sent to doctor : ${doctor.name}`);
    } catch (error: any) {
      console.log('send appointment cancelled notification error : ', error);
      throw error;
    }
  }

  async createVideoCallNotification(data: VideoCallNotificationData): Promise<void> {
    try {
      let title: string;
      let message: string;
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'high';
      
      // Get user names for better messaging
      const initiatorName = await this.getUserName(data.initiatorId, data.initiatorRole);
      const appointment = await this.appointmentRepo.findById(data.appointmentId);
      
      // Get recipient details for socket targeting
      const recipientRole = data.initiatorRole === 'doctor' ? 'patient' : 'doctor';

      switch (data.type) {
        case 'video_call_initiated':
          title = 'Incoming Video Call';
          message = `${initiatorName} is calling you for your appointment`;
          priority = 'urgent';
          break;
        case 'video_call_ended':
          title = 'Video Call Ended';
          message = `Video call with ${initiatorName} has ended`;
          if (data.duration) {
            message += ` (Duration: ${Math.floor(data.duration / 60)}:${String(data.duration % 60).padStart(2, '0')})`;         
          }
          priority = 'medium';
          break;
        case 'call_missed':
          title = 'Missed Video Call';
          message = `You missed a video call from ${initiatorName} for your appointment`;
          priority = 'high';
          break;
        default:
          throw new Error(`Unknown video call notification type: ${data.type}`);
      }

      // Enhanced notification data with ALL required fields for video calls
      const enhancedNotificationData = {
        appointmentId: data.appointmentId,
        roomId: data.roomId, // CRITICAL: Include roomId
        initiatorRole: data.initiatorRole,
        initiatorName: initiatorName,
        callType: 'video',
        appointmentTime: data.appointmentTime || (appointment ? `${appointment.startTime}-${appointment.endTime}` : ''),
        appointmentDate: appointment?.date?.toISOString().split('T')[0] || '',
        duration: data.duration,
        // Additional data for better UX
        doctorName: data.initiatorRole === 'doctor' ? initiatorName : undefined,
        patientName: data.initiatorRole === 'patient' ? initiatorName : undefined,
        ...data.data // Merge any additional data
      };

      // Create persistent notification
      const notification = await this.creatNotificationUC.execute({
        recipientId: data.recipientId,
        recipientType: recipientRole,
        senderId: data.initiatorId,
        senderType: data.initiatorRole,
        type: data.type,
        title,
        message,
        data: enhancedNotificationData,
        isRead: false,
        priority,
      });

      // Send enhanced real-time notification via Socket.IO
      const socketNotificationData = {
        id: notification?.id,
        userId: data.recipientId,
        title,
        message,
        type: data.type,
        data: enhancedNotificationData,
        createdAt: new Date(),
        isRead: false
      };

      // Send standard notification
      this.sendSocketNotification(data.recipientId, 'new_notification', socketNotificationData);

      // For video call initiated, also send specific video call event
      if (data.type === 'video_call_initiated') {
        const videoCallData = {
          roomId: data.roomId,
          appointmentId: data.appointmentId,
          initiatorRole: data.initiatorRole,
          initiatorId: data.initiatorId,
          initiatorName: initiatorName,
          callType: 'video',
          appointmentTime: enhancedNotificationData.appointmentTime,
          appointmentDate: enhancedNotificationData.appointmentDate,
          recipientId: data.recipientId
        };

        console.log('Sending incoming video call socket event:', videoCallData);
        
        // Send to specific recipient based on role
        const socketServer = getSocketServer();
        if (recipientRole === 'patient') {
          socketServer.sendToPatient(data.recipientId, 'incoming_video_call', videoCallData);
        } else {
          socketServer.sendToDoctor(data.recipientId, 'incoming_video_call', videoCallData);
        }
        
        // Also dispatch the custom event for frontend handling
        this.sendSocketNotification(data.recipientId, 'incoming_video_call', videoCallData);
      }

      console.log(`Video call notification sent: ${data.type} to user ${data.recipientId} with roomId: ${data.roomId}`);
    } catch (error: any) {
      console.error('Error creating video call notification:', error);
      throw error;
    }
  }

  async sendAppointmentReminder(data: ReminderNotificationData): Promise<void> {
    try {
      // Send reminder to patient
      const patientNotification = await this.creatNotificationUC.execute({
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'appointment_confirmed',
        title: 'Appointment Reminder',
        message: `Your appointment with Dr. ${data.doctorName} is in 1 hour`,
        data: {
          appointmentId: data.appointmentId,
          doctorId: data.doctorId,
          doctorName: data.doctorName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime
        },
        isRead: false,
        priority: 'high'
      });

      // Send reminder to doctor
      const doctorNotification = await this.creatNotificationUC.execute({
        recipientId: data.doctorId,
        recipientType: 'doctor',
        type: 'appointment_confirmed',
        title: 'Appointment Reminder',
        message: `Your appointment with ${data.patientName} is in 1 hour`,
        data: {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          patientName: data.patientName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime
        },
        isRead: false,
        priority: 'high'
      });

      // Send socket notifications
      this.sendSocketNotification(data.patientId, 'appointment_reminder', {
        id: patientNotification?.id,
        title: 'Appointment Reminder',
        message: `Your appointment with Dr. ${data.doctorName} is in 1 hour`,
        type: 'appointment_confirmed',
        data: {
          appointmentId: data.appointmentId,
          doctorId: data.doctorId,
          doctorName: data.doctorName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime
        },
        createdAt: new Date(),
        isRead: false
      });

      this.sendSocketNotification(data.doctorId, 'appointment_reminder', {
        id: doctorNotification?.id,
        title: 'Appointment Reminder',
        message: `Your appointment with ${data.patientName} is in 1 hour`,
        type: 'appointment_confirmed',
        data: {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          patientName: data.patientName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime
        },
        createdAt: new Date(),
        isRead: false
      });

      console.log(`Appointment reminders sent for appointment ${data.appointmentId}`);
    } catch (error: any) {
      console.error('Error sending appointment reminders:', error);
      throw error;
    }
  }

  // Helper method to send socket notifications
  private sendSocketNotification(userId: string, event: string, data: any): boolean {
    try {
      const socketServer = getSocketServer();
      const sent = socketServer.sendToUser(userId, event, data);
      console.log(`Socket notification sent to ${userId}: ${event} - Success: ${sent}`);
      return sent;
    } catch (error) {
      console.error(`Failed to send socket notification to ${userId}:`, error);
      return false;
    }
  }

  // Enhanced method to send immediate video call notifications
  async sendImmediateVideoCallNotification(
    recipientId: string,
    roomId: string,
    appointmentId: string,
    initiatorName: string,
    initiatorRole: 'doctor' | 'patient'
  ): Promise<boolean> {
    try {
      const socketServer = getSocketServer();
      const callData = {
        roomId,
        appointmentId,
        initiatorRole,
        initiatorName,
        callType: 'video',
        timestamp: new Date()
      };

      // Send to appropriate role
      if (initiatorRole === 'doctor') {
        return socketServer.sendToPatient(recipientId, 'incoming_video_call', callData);
      } else {
        return socketServer.sendToDoctor(recipientId, 'incoming_video_call', callData);
      }
    } catch (error) {
      console.error('Error sending immediate video call notification:', error);
      return false;
    }
  }

  // Method to notify about call status changes
  async notifyCallStatusChange(
    roomId: string,
    status: 'started' | 'ended' | 'failed',
    participants: string[],
    additionalData?: any
  ): Promise<void> {
    try {
      const socketServer = getSocketServer();
      const statusData = {
        roomId,
        status,
        timestamp: new Date(),
        ...additionalData
      };

      participants.forEach(userId => {
        socketServer.sendToUser(userId, 'video_call_status_change', statusData);
      });

      console.log(`Call status change notification sent: ${status} for room ${roomId}`);
    } catch (error) {
      console.error('Error sending call status change notification:', error);
    }
  }

  private async getUserName(userId: string, userType: 'doctor' | 'patient'): Promise<string> {
    try {
      if (userType === 'doctor') {
        const doctor = await this.doctorRepo.findById(userId);
        return doctor ? `Dr. ${doctor.name}` : 'Doctor';
      } else {
        const patient = await this.patientRepo.findById(userId);
        return patient ? patient.name : 'Patient';
      }
    } catch (error) {
      console.error(`Error getting user name for ${userId}:`, error);
      return userType === 'doctor' ? 'Doctor' : 'Patient';
    }
  }
}