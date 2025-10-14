import { injectable } from 'tsyringe';
import { IAppointmentRepository } from '../../../domain/repositories/AppointmentRepository';
import { Appointment } from '../../../domain/entities/Appointment.entiry';
import { AppointmentModel } from '../models/AppointmentModel';
import { AppointmentStatsResponse, SpecializationStatsResponse } from '../../../domain/repositories/DashboardRepository';
import { IDashboardRepository } from '../../../domain/repositories/DashboardRepository';
import { DoctorModel } from '../models/DoctorModel';
import { SpecializationModel } from '../models/specialization.model';


@injectable()

export class MongoDashboardRepo implements IDashboardRepository{
    async getAppointmentStats(startDate: Date, endDate: Date): Promise<AppointmentStatsResponse> {
        const appointments=await AppointmentModel.find({
            date:{$gte:startDate,$lte:endDate}
        }).sort({date:1})

        const totalAppointments=appointments.length;
         const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;
    const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;

const revenue = appointments
  .filter(a => a.paymentStatus === 'paid' || a.paymentStatus === 'pending')
  .reduce((sum, a) => sum + (a.consultationFee || 0), 0);

  
   const dateMap = new Map<string, {
      appointments: number;
      confirmed: number;
      pending: number;
      cancelled: number;
      completed: number;
    }>();
    const currentDate=new Date(startDate);
    while(currentDate <= endDate){
        const dateStr=currentDate.toISOString().split('T')[0];
        dateMap.set(dateStr,{
            appointments:0,
            confirmed:0,
            pending:0,
            cancelled:0,
            completed:0
        });
        currentDate.setDate(currentDate.getDate()+1)
    }

    appointments.forEach(appointment=>{
        const dateStr=new Date(appointment.date).toISOString().split('T')[0];
        const stats=dateMap.get(dateStr);
        if(stats){
            stats.appointments++;
            if(appointment.status==='confirmed') stats.confirmed++;
            if (appointment.status === 'pending') stats.pending++;
        if (appointment.status === 'cancelled') stats.cancelled++;
        if (appointment.status === 'completed') stats.completed++;
        }
    })
   const chartData = Array.from(dateMap.entries()).map(([date, stats]) => ({
      date,
      ...stats
    }));
     return {
      totalAppointments,
      confirmedAppointments,
      pendingAppointments,
      cancelledAppointments,
      completedAppointments,
      chartData,
      revenue
    };

    }

    async getSpecializationStats(): Promise<SpecializationStatsResponse[]> {
        try {
            const doctorsBySpecialization=await DoctorModel.aggregate([
                {$match:{
                      isBlocked: false,
          status: 'approved'
                }},
                {
                    $group:{
                        _id:'$specialization',
                        count:{$sum:1}
                    }
                }
            ])
            const doctorCountMap=new Map<string,number>();
            doctorsBySpecialization.forEach(item=>{
                if(item._id){
                    doctorCountMap.set(item._id.toString(),item.count)
                }
            })

            const specializations=await SpecializationModel.find()
            const stats:SpecializationStatsResponse[]=specializations.map(sp=>({
                specializationId:sp._id.toString(),
                specializationName:sp.name,
                doctorCount:doctorCountMap.get(sp._id.toString())||0,
                imageUrl:sp.imageUrl
            }));
            return stats.sort((a,b)=>b.doctorCount-a.doctorCount)
        } catch (error) {
             console.error('Error fetching specialization stats:', error);
    throw new Error('Failed to fetch specialization statistics');
        }
    }
}