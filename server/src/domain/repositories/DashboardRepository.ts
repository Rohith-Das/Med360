import { Appointment } from "../entities/Appointment.entiry";


export interface AppointmentStatsResponse {
  totalAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  completedAppointments: number;
  chartData: Array<{
    date: string;
    appointments: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    completed: number;
  }>;
  revenue: number;
}
export interface SpecializationStatsResponse{
  specializationId:string;
  specializationName:string;
  doctorCount:number;
  imageUrl:string;
}

export interface IDashboardRepository{

    getAppointmentStats(startDate:Date,endDate:Date):Promise<AppointmentStatsResponse>;
  getSpecializationStats():Promise<SpecializationStatsResponse[]>

}