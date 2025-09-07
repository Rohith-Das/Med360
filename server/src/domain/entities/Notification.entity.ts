

export interface Notification{
    id?:string;
    recipientId:string;
    recipientType:'doctor'|'admin'|'patient';
    senderId?:string;
     senderType?: 'patient' | 'doctor' | 'admin' ;
      type: 'appointment_booked' | 'appointment_cancelled' | 'appointment_confirmed' | 'appointment_rescheduled' | 'payment_received' | 'payment_refunded' | 'system_announcement';
  title: string;
  message: string;
  data?: {
    appointmentId?: string;
    patientId?: string;
    doctorId?: string;
    paymentId?: string;
    amount?: number;
    appointmentDate?: string;
    appointmentTime?: string;
    doctorName?: string;
    patientName?: string;
    specialization?: string;
    consultationFee?: number;
    refundAmount?: number;
  };
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}