import { Request,Response } from "express";
import { container } from "tsyringe";
import { GetDoctorAppointmentUC } from "../../../application/Appointment/GetDoctorsAppointmentUC";
import { AuthRequest } from "../../middlewares/AuthRequest";
import { success } from "zod";

export class DoctorAppointmentController{
    async getAppointment(req:AuthRequest,res:Response):Promise<Response>{
        try {
            const doctorId=req.user?.userId;
            if(!doctorId){
                return res.status(401).json({success:false,message:'unauthorized'})
            }
            const UC=container.resolve(GetDoctorAppointmentUC);
            const appointments=await UC.execute(doctorId)

            const transFormedAppointments=appointments.map(apt=>({
              ...apt,
              patient:apt.patientId ?{
                name:(apt.patientId as any).name,
                email:(apt.patientId as any).email
              }:undefined
            }))
            return res.status(200).json({
                success: true,
        message: "Appointments fetched successfully",
        data: transFormedAppointments,
            })
        } catch (error:any) {
            console.error("Doctor getAppointments error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch appointments",
      }); 
        }
    }

    async getAppointmentByid(req:AuthRequest,res:Response):Promise<Response>{
        try {
            const doctorId=req.user?.userId;
            const {appointmentId}=req.params;
             if (!doctorId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const useCase=container.resolve(GetDoctorAppointmentUC);
      const appointments=await useCase.execute(doctorId)

      const appointment=appointments.find((apt)=>apt.id===appointmentId)
       if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Appointment retrieved successfully",
        data: appointment,
      });
        } catch (error:any) {
           console.error("Doctor getAppointmentById error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch appointment",
      });
        
        }
    }
}