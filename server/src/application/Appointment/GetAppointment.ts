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
          const patient=await this.repo.findByPatientId(patientId)
          

          return patient;
      } catch (error:any) {
        throw new Error('patient not found for appointment UC')
      }
    }
}