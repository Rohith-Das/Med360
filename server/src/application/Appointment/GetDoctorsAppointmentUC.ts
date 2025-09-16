import { injectable,inject } from "tsyringe";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { Appointment } from "../../domain/entities/Appointment.entiry";

@injectable()
export class GetDoctorAppointmentUC{
    constructor(
        @inject('IAppointmentRepository')private repo:IAppointmentRepository
    ){}

    async execute(doctorId:string):Promise<Appointment[]>{
      try {
          const appointments =await this.repo.findByDoctorId(doctorId)
          
          return appointments.map(apt=>({
            ...apt,
            patient:apt.patientId?{
              name:(apt.patientId as any).name,
              email:(apt.patientId as any).email
            }:undefined
          }))
      } catch (error:any) {
        throw new Error('doctor not found for appointment UC')
      }
    }
}