import { injectable,inject } from "tsyringe";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { Appointment } from "../../domain/entities/Appointment.entiry";

@injectable()
export class GetAppointmentUC{
    constructor(
        @inject('IAppointmentRepository')private repo:IAppointmentRepository
    ){}

    async execute(patientId:string):Promise<Appointment[]>{
      try {
          const appointments=await this.repo.findByPatientId(patientId)
          

             return appointments.map(apt => ({
        ...apt,
        doctor: apt.doctorId ? {
          name: (apt.doctorId as any).name,
          specialization: (apt.doctorId as any).specialization
        } : undefined
          }))
      } catch (error:any) {
        throw new Error('patient not found for appointment UC')
      }
    }
}