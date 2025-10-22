import { injectable, inject } from "tsyringe";
import { IDashboardRepository, SpecializationStatsResponse } from "../../domain/repositories/DashboardRepository";

export interface AppointmentStatsFilters{
    period:'today'|'week'|'month';
    startDate?:Date;
    endDate?:Date;
}

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

export interface RevenueStatsResponse{
  totoalRevenue:number;
  totalAppointments:number;
  averageRevenue:number;
  chartData:Array<{
    date:string;
    revenue:number;
    appointments:number
  }>;
  previousPeriodRevenue:number;
  growthPercentage:number
}

@injectable()
export class DashBoardUC{
      constructor(
    @inject("IDashboardRepository")
    private DashRepo: IDashboardRepository
  ) {}

  async execute(filters:AppointmentStatsFilters):Promise <AppointmentStatsResponse>{
    const dateRange=this.getDateRange(filters.period);
    const stats=await this.DashRepo.getAppointmentStats(
        dateRange.startDate,
        dateRange.endDate
    )
    return stats
  }
  private getDateRange(period:'today'|'week'|'month'):{startDate:Date;endDate:Date}{
    const endDate=new Date()
    endDate.setHours(23,59,59,999)
    const startDate=new Date()

    switch(period){
        case "today":
            startDate.setHours(0,0,0,0);
            break;
        case "week":
            startDate.setDate(startDate.getDate()-6)
            startDate.setHours(0,0,0,0);
            break;
        case "month":
            startDate.setDate(startDate.getDate()-29);
            startDate.setHours(0,0,0,0)
            break;
    }
    return {startDate,endDate}
  }

  async getSpecializationStats():Promise<SpecializationStatsResponse[]>{
    return await this.DashRepo.getSpecializationStats()
  }

}