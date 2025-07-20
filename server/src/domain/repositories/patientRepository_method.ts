import { Patient } from "../entities/patient.entity";

export interface IPatientRepository{
    create(patient:Patient):Promise<Patient>;
    findByEmail(email:string):Promise<Patient|null>
    findById(id: string): Promise<Patient | null>; 
    findByMobileNumber(mobile: string): Promise<Patient | null>;
    update(id: string, patientData: Partial<Patient>): Promise<Patient>;
    requestPasswordRest(email:string,otp:string,otpExpiresAt:Date):Promise<void>;
    resetPasswordWithOtp(email:string,otp:string,newPassword:string):Promise<Patient>
    findAll(page:number,limit:number,filters?:{
        isBlocked?:boolean;
        isDeleted?:boolean;
        searchTerm?:string;
    }):Promise<{patients:Patient[];total:number,totalPages:number;currentPage:number;}>;
    blockPatient(id:string):Promise<Patient>;
    unblockPatient(id:string):Promise<Patient>;
    softDeletedPatient(id:string):Promise<Patient>;
    getPatientStats():Promise<{
        totalPatients:number;
        activedPatient:number;
        blockedPatient:number;
        deletedPatient:number;
    }>
}