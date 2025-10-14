import { DashBoardUC } from "../../../application/DashBoard/DashboardUC";
import { injectable, inject, container } from "tsyringe";
import { Request, Response } from "express";
import { success } from "zod";


export class DashboardController{

async getAppointmentStats(req:Request,res:Response):Promise<Response>{
    try {
        const {period='today'}=req.query; 
          if (!['today', 'week', 'month'].includes(period as string)) {
      return res.status(400).json({
        success: false,
        message: "Invalid period. Must be 'today', 'week', or 'month'"
      });
    }

    const usecase=container.resolve(DashBoardUC);
    const result=await usecase.execute({
        period:period as 'today'|'week'|'month'
    })
    return res.status(200).json({
        success:true,
        message:'appointment stats retrieved successfully',
        data:result
    })
    } catch (error:any) {
          console.error('Appointment stats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve appointment stats"
    });
    }

}

async getSpecializationStats(req:Request,res:Response):Promise<Response>{
  try {
    const usecase=container.resolve(DashBoardUC)
    const result=await usecase.getSpecializationStats();

    return res.status(200).json({
      success:true,
      message:'specialization stats retieved successfully',
      data:result
    })
  } catch (error:any) {
      console.error('Specialization stats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve specialization stats"
    });
  }
}
}