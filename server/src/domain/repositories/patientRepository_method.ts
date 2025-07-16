import { Patient } from "../entities/patient.entity";

export interface IPatientRepository{
    create(patient:Patient):Promise<Patient>;
    findByEmail(email:string):Promise<Patient|null>
    findById(id: string): Promise<Patient | null>; 
    findByMobileNumber(mobile: string): Promise<Patient | null>;
    update(id: string, patientData: Partial<Patient>): Promise<Patient>;
}