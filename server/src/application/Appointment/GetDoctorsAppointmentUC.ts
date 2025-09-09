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
          const doctor=await this.repo.findByDoctorId(doctorId)
          
          return doctor;
      } catch (error:any) {
        throw new Error('doctor not found for appointment UC')
      }
    }
}