import { inject,injectable } from "tsyringe";
import { CreateNotificationUC } from "./CreateNotificationUC";
import { IPatientRepository } from "../../domain/repositories/patientRepository_method";
import { IDoctorRepository } from "../../domain/repositories/DoctorRepository-method";


export interface AppointmentNotificationData{
    appointmentId:string;
    patientId:string;
    doctorId:string;
    appointmentData:string;
    appointmentTime:string;
    consultingFee:number;
    type:'booked'|'cancelled'|'confirm';
    cancelReason?:string;
    refundAmount?:number;
}

@injectable()
export class NotificationService{
    constructor(
        private creatNotificationUC:CreateNotificationUC,
        @inject('IPatientRepository') private patientRepo:IPatientRepository,
        @inject('IDoctorRepository')private doctorRepo:IDoctorRepository
    ){}

    async sendAppointmentBookedNotification(data:AppointmentNotificationData):Promise<void>{
        try {
            const [patient,doctor]=await Promise.all([
                this.patientRepo.findById(data.patientId),
                this.doctorRepo.findById(data.doctorId)
            ])
        console.log(`patient&doctor in notificationService${patient},${doctor}`);
        if(!doctor || !patient){
            throw new Error("patient and doctor not found")
        }
        await this.creatNotificationUC.execute({
            recipientId:data.doctorId,
            recipientType:'doctor',
            senderId:data.patientId,
            senderType:'patient',
            type:'appointment_booked',
            title:'New Appointment Booked',
            message:`${patient.name} has booked an appointment with you`,
            data:{
                appointmentId:data.appointmentId,
                patientId:data.patientId,
                patientName:patient.name,
                appointmentDate:data.appointmentData,
                appointmentTime:data.appointmentTime,
                consultationFee:data.consultingFee,
                // specialization:typeof doctor.specialization==='object'?doctor.specialization.
            },
            isRead:false,
            priority:'high'
        })
        console.log(`appointment booked notification send to doctor : ${doctor.name}`);
        
        } catch (error:any) {
            console.log('send appointment booked notification error',error);
            throw error
        }
    }

    async sendAppointmentCancelledNotification(data:AppointmentNotificationData):Promise<void>{
        try {
             const [patient,doctor]=await Promise.all([
                this.patientRepo.findById(data.patientId),
                this.doctorRepo.findById(data.doctorId)
            ])
            if(!doctor || !patient){
                throw new Error('patient and doctor not found')
            }
            await this.creatNotificationUC.execute({
                recipientId:data.doctorId,
                recipientType:'doctor',
                senderId:data.patientId,
                senderType:'patient',
                type:'appointment_cancelled',
                title:'appointment cancelled',
                message:`${patient.name} has cancelled their appointment`,
                data:{
                    appointmentId:data.appointmentId,
                    patientId:data.patientId,
                    patientName:patient.name,
                    appointmentDate:data.appointmentData,
                    appointmentTime:data.appointmentTime,
                    consultationFee:data.consultingFee,
                    refundAmount:data.refundAmount,
                },
                isRead:false,
                priority:'medium'
            })
            console.log(`Appointment cancelled notification sent to doctor : ${doctor.name}`);
            
        } catch (error:any) {
            console.log('send appointment cancelled notification error : ',error);
            throw error;
        }
    }
}

