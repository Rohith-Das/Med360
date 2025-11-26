import { IPrescriptionRepository } from "../../domain/repositories/PrescriptionRepository";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { Prescription } from "../../domain/entities/Prescription.entity";
import { injectable,inject } from "tsyringe";

@injectable()

export class CreatePrescriptionUC{
    constructor(
        @inject('IPrescriptionRepository') private repo:IPrescriptionRepository,
        @inject('IAppointmentRepository') private appointmentRepo:IAppointmentRepository,
    ){}

    async execute(data:Omit<Prescription,'id'>):Promise<Prescription>{
        const appointment=await this.appointmentRepo.findById(data.appointmentId.toString());

        const existing=await this.repo.findByAppointmentId(data.appointmentId.toString());
         if (existing) {
             return existing; 
    }
    return await this.repo.create(data)
    }
}


















