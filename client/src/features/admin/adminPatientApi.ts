import adminAxiosInstance from "../../api/adminAxiosInstance";

export interface Patient {
  id: string;
  name: string;
  email: string;
  mobile: string;
  isBlocked: boolean;
  isDeleted: boolean;
  isVerified: boolean;
  role: 'patient' | 'doctor' | 'admin';
  gender?: 'male' | 'female';
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}
export interface PatientsResponse{
    patients:Patient[];
    total:number;
    totalPage:number;
    currentPage:number;
}
export interface PatientStats{
    totalPatients:number;
    activePatients:number;
    blockedPatients:number;
    deletedPatients:number;
}

export const adminApi={
    getPatients:async(params:{
        page?:number;
        limit?:number;
        isBlocked?:boolean;
        isDeleted?:boolean;
        searchTerm?:string;
    })=>{
        const response=await adminAxiosInstance.get("/admin/patients",{params});
        return response.data.data as PatientsResponse;
    },

    getPatientStats:async()=>{
        const response=await adminAxiosInstance.get("/admin/patients/stats");
        return response.data.data as PatientStats;
    },

    blockPatient:async(patientId:string)=>{
        const response=await adminAxiosInstance.put(`/admin/patients/${patientId}/block`);
        return response.data;
    },

    unblockPatient:async(patientId:string)=>{
        const response=await adminAxiosInstance.put(`/admin/patients/${patientId}/unblock`);
        return response.data
    },
    deletePatient:async(patientId:string)=>{
        const response=await adminAxiosInstance.delete(`/admin/patients/${patientId}`)
        return response.data;
    }
}