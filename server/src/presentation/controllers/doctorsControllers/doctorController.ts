import { Request,Response } from "express";
import { container } from "tsyringe";
import { DoctorLoginUC } from "../../../application/doctors/AuthUC/DoctorLoginUC";
import { doctorRefereshTokenUc } from "../../../application/doctors/AuthUC/DoctorRefreshTokenUC";
import { success } from "zod";
import {GetAllDoctorUC } from "../../../application/doctors/GetAllDoctorUC";
import { promises } from "dns";
import { UpdateDoctorUC } from "../../../application/doctors/UpdateDoctorUC";
import { BlockDoctorUC } from "../../../application/doctors/BlockDoctorsUC";
import { UnBlockDoctorUC } from "../../../application/doctors/UnblockDoctorUC";

export class DoctorController{
    async login(req:Request,res:Response):Promise<Response>{
        const {email,password}=req.body;
        try {
            const loginUC=container.resolve(DoctorLoginUC);
            const result=await loginUC.execute({email,password});
             res.cookie("doctorRefreshToken", result.doctorRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
       return res.status(200).json({
        success: true,
        message: "Doctor Login Successful",
        data: {
          doctorAccessToken: result.doctorAccessToken,
          doctor: result.doctor,
        },
      });
        } catch (error:any) {
      return res.status(401).json({ success: false, message: error.message });
        }
    }

    async refreshToken(req:Request,res:Response):Promise<Response>{
        try {
            const refreshToken=req.cookies.doctorRefreshToken ;
            if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Doctor refresh token not found' });
      }
      const useCase=container.resolve(doctorRefereshTokenUc)
      const newAT=await useCase.execute(refreshToken)
      return res.status(200).json({
        success:true,
        message:"Doctor access toekn refreshed successfully",
        data:{
            doctorAccessToken:newAT
        }
      })
        } catch (error:any) {
             console.error('Doctor refresh token error:', error.message);
      return res.status(403).json({ success: false, message: error.message || 'Could not refresh doctor token' });
        }
    }
     async getAllDoctors(req:Request,res:Response):Promise<Response>{
        try {
            const Uc=container.resolve(GetAllDoctorUC)
            const doctors=await Uc.execute();

            return res.status(200).json({
                  success: true,
        message: "Doctors retrieved successfully",
        data: doctors,
            })
        } catch (error:any) {
              return res.status(500).json({ success: false, message: error.message || "Failed to retrieve doctors" });
        }
    }
    async UpdateDoctor(req:Request,res:Response):Promise<Response>{
      const {id}=req.params;
      const data=req.body;
      try {
        const useCase=container.resolve(UpdateDoctorUC)
        const updatedDoctor=await useCase.execute(id,data)
        return res.status(200).json({
           success: true,
        message: "Doctor updated successfully",
        data: updatedDoctor,
        })
      } catch (error:any) {
          console.error('Update doctor error:', error.message);
      return res.status(400).json({ success: false, message: error.message || 'Could not update doctor' });
      }
    }
    async BlockDoctor(req:Request,res:Response):Promise<Response>{
      const {id}=req.params;
      if(!id){
         return res.status(400).json({ success: false, message: 'Doctor ID is required'});
      }
      console.log("doctor id from controller",id)
      try {
        const uc=container.resolve(BlockDoctorUC)
        await uc.execute(id)

        return res.status(200).json({
     success: true,
        message: "Doctor blocked successfully",
        })
      } catch (error:any) {
         console.error('Block doctor error:', error.message);
      return res.status(400).json({ success: false, message: error.message || 'Could not block doctor' });
      }
    }
      async unblockDoctor(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    try {
      const useCase = container.resolve(UnBlockDoctorUC);
      await useCase.execute(id);
      return res.status(200).json({
        success: true,
        message: "Doctor unblocked successfully",
      });
    } catch (error: any) {
      console.error('Unblock doctor error:', error.message);
      return res.status(400).json({ success: false, message: error.message || 'Could not unblock doctor' });
    }
  }
  async getDoctorsBySpecialization(req:Request,res:Response):Promise<Response>{
    const {specializationId}=req.params;
    try {
      const useCase=container.resolve(GetAllDoctorUC);
      const doctors=await useCase.execute({specializationId});
      return res.status(200).json({
        success:true,
        message:"doctor retrived successfully",
        data:doctors
      })
    } catch (error:any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve doctors",
      });
    }
  }
}