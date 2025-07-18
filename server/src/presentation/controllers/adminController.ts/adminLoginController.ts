import { Request,Response } from "express";
import { container } from "tsyringe";
import { AdminLoginUC } from "../../../application/admin/usecase/adminLoginUC";

export const adminLoginController=async(req:Request,res:Response):Promise<Response> =>{
    const {email,password}=req.body;
    try {
        const loginUC=container.resolve(AdminLoginUC)
        const result= await loginUC.execute({email,password});
        res.cookie("adminRefreshToken", result.adminRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    return res.status(200).json({
      success: true,
      message: "Admin Login Successful",
      data: {
        adminAccessToken: result.adminAccessToken,
        admin: result.admin
      }
    });
    } catch (error:any) {
     return res.status(401).json({ success: false, message: error.message });    }
}