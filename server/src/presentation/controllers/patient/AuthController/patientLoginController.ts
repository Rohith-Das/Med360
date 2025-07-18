import { Request,Response } from "express";
import { container } from "tsyringe";
import { patientLoginUC } from "../../../../application/patients/usecase/AuthUseCase/patientLoginUC";
import { success } from "zod";

export const patientLoginController=async(req:Request,res:Response):Promise<Response>=>{
    const {email,password}=req.body;
    try {
        const loginUC=container.resolve(patientLoginUC)
        const result=await loginUC.execute({email,password});
        res.cookie("refreshToken",result.refreshToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV === "production",
            sameSite:'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.status(200).json({
            success:true,
            message:"Login Successful",
            data:{
                accessToken:result.accessToken,
                patient:result.patient
            }
        })
    } catch (error:any) {
      return res.status(401).json({ success: false, message: error.message });
    }
}