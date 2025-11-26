import { Prescription } from "../entities/Prescription.entity";

export interface IPrescriptionRepository{
    create(Prescription:Omit<Prescription,'id'>):Promise<Prescription>;
    findById(id:string):Promise<Prescription|null>;
    findByAppointmentId(appointmentId:string):Promise<Prescription|null>;
    findByDoctorId(doctorId:string):Promise<Prescription[]>
     findByPatientId(patientId:string):Promise<Prescription[]>
       update(id: string, updates: Partial<Prescription>): Promise<Prescription | null>;
  softDelete(id: string): Promise<boolean>;

}