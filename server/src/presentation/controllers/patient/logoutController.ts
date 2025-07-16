import { Request,Response } from "express";
import { container } from "tsyringe";
import { IPatientRepository } from "../../../domain/repositories/patientRepository_method";

export const logoutController=async(req:Request,res:Response)=>{
    try {
        const{refreshToken}=req.body;
        if (!refreshToken) {
      return res.status(400).json({ success: false, message: "No refresh token found" });
    }
    const patientRepo=container.resolve<IPatientRepository>("IPatientRepository");
    const patient=await patientRepo.findByEmail(req.body.email);
      if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    await patientRepo.update(patient.id!,{
        refreshToken: undefined,
      refreshTokenExpiresAt: undefined,
    })
    res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
   res.status(200).json({ success: true, message: "Logout successful" });
    } catch (err:any) {
    res.status(500).json({ success: false, message: "Server error during logout" });
    }
}