import { container, inject, injectable } from "tsyringe";
import { CreateNotificationUC } from "./CreateNotificationUC";
import { IPatientRepository } from "../../domain/repositories/patientRepository_method";
import { IDoctorRepository } from "../../domain/repositories/DoctorRepository-method";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";

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
      await this.creatNotificationUC.execute({
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
      await this.creatNotificationUC.execute({
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
      const initiatorName = await this.getUserName(data.initiatorId, data.initiatorRole);
      const appointment = await this.appointmentRepo.findById(data.appointmentId);

      switch (data.type) {
        case 'video_call_initiated':
          title = 'Incoming Video Call';
          message = `${initiatorName} (${data.initiatorRole}) is calling you for your appointment`;
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

      await this.creatNotificationUC.execute({
        recipientId: data.recipientId,
        recipientType: data.initiatorRole === 'doctor' ? 'patient' : 'doctor',
        senderId: data.initiatorId,
        senderType: data.initiatorRole,
        type: data.type === 'video_call_initiated' ? 'video_call_initiated' : 'system_announcement',
        title,
        message,
        data: {
          appointmentId: data.appointmentId,
          roomId: data.roomId,
          // callType: 'video',
          appointmentTime: data.appointmentTime || appointment?.startTime + '-' + appointment?.endTime,
          appointmentDate: appointment?.date?.toISOString().split('T')[0]
        },
        isRead: false,
        priority,
      });
      console.log(`Video call notification sent: ${data.type} to user ${data.recipientId}`);
    } catch (error: any) {
      console.error('Error creating video call notification:', error);
      throw error;
    }
  }

  async sendAppointmentReminder(data: ReminderNotificationData): Promise<void> {
    try {
      // Send reminder to patient
      await this.creatNotificationUC.execute({
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
      await this.creatNotificationUC.execute({
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

      console.log(`Appointment reminders sent for appointment ${data.appointmentId}`);
    } catch (error: any) {
      console.error('Error sending appointment reminders:', error);
      throw error;
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
      return userType === 'doctor' ? 'Doctor' : 'Patient';
    }
  }
}