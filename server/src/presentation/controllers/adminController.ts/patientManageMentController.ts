import { Request,Response } from "express";
import { container } from "tsyringe";
import { GetAllPtientsUC } from "../../../application/admin/usecase/getAllPatientsUC";
import { blockPatientUC } from "../../../application/admin/usecase/blockPatientUC";
import { unblockPatientUC } from "../../../application/admin/usecase/unblockPatientUC";
import { SoftDeletePatientUC } from "../../../application/admin/usecase/SoftDeletePatientUC ";
import { success } from "zod";
import { getPatientStats } from "../../../application/admin/usecase/getPatientStatsUC";

export const getAllPatientsController =async(req:Request,res:Response):Promise<Response>=>{

    try {
        const {page=1,limit=10,isBlocked,isDeleted,searchTerm}=req.query;
        const useCase=container.resolve(GetAllPtientsUC)

        const filters:any={};
        if(isBlocked !== undefined) filters.isBlocked=isBlocked==="true";
        if(isDeleted !== undefined) filters.isDeleted=isDeleted==="true";
        if(searchTerm) filters.searchTerm=searchTerm as string;

        const result=await useCase.execute({
            page:Number(page),
            limit:Number(limit),
            ...filters
        })
        return res.status(200).json({
            success:true,
            message:"Patient retrived successfully",
            data:result
        })
    } catch (error:any) {
        return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve patients"
    });
    }
}

export const blockPatientController=async(req:Request,res:Response):Promise<Response>=>{
    try {
        const {patientId}=req.params;
        const useCase=container.resolve(blockPatientUC);
        const result=await useCase.execute(patientId)

        return res.status(200).json({
            success:true,
            message:"Patient blocked successfully",
            data:result
        })
    } catch (error:any) {
        return res.status(400).json({
            success:false,
            message:error.message || "failed to block patient"
        })
    }
}

export const unblockPatientController=async(req:Request,res:Response):Promise<Response>=>{
    try {
        const {patientId}=req.params;
        const useCase=container.resolve(unblockPatientUC);
        const result=await useCase.execute(patientId);
        return res.status(200).json({
            success:true,
            message:"patient unblock successfully",
            data:result
        })
    } catch (error:any) {
        return res.status(400).json({
            success:false,
            message:error.message || "failed to unblock patient"
        })
    }
}

export const softDeletedPatientController=async(req:Request,res:Response):Promise<Response>=>{
    try {
        const {patientId}=req.params;
        const useCase=container.resolve(SoftDeletePatientUC);
        const result=await useCase.execute(patientId);

        return res.status(200).json({
            success:true,
            message:"patient delete successfully",
            data:result
        })
    } catch (error:any) {
        return res.status(400).json({
            success:false,
            message:error.message || "patient delete failed"
        })
    }
}

export const getPatientStatsController=async(req:Request,res:Response):Promise<Response>=>{
    try {
        const useCase=container.resolve(getPatientStats);
        const result=await useCase.execute();
        return res.status(200).json({
            success:true,
            message:"patient stats retrive successfully",
            data:result
        })
    } catch (error:any) {
        return res.status(500).json({
            success:false,
            message:error.message ||"failed to retrive patient stats"
        })
    }
}