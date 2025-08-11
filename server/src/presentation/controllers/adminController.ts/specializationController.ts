import { Request,Response } from "express";
import { container } from "tsyringe";
import { CreateSpecializationUC } from "../../../application/admin/usecase/specialization/createSpecializationUC";
import { getSpecializationsUC } from "../../../application/admin/usecase/specialization/getSpecializationsUC";
import { updateSpecializationUC } from "../../../application/admin/usecase/specialization/updateSpecializationUC";
import { DeleteSpecializationUC } from "../../../application/admin/usecase/specialization/deleteSpecializationUC";
import { upload } from "../../../infrastructure/config/multerConfig";
import { success } from "zod";

export const createSpecialization =async (req:Request,res:Response)=>{
   
    try {
         console.log('Request body:', req.body);
    console.log('Request file:', req.file);
      if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image file is required"
            });
        }
        const UC=container.resolve(CreateSpecializationUC);
        const sp=await UC.execute({
            ...req.body,
            imageFile:req.file
        })
        return res.status(201).json({
            success:true,
            data:sp
        })
    } catch (error:any) {
        console.error('Error in createSpecialization:', error);
         return res.status(400).json({
      success: false,
      message: error.message
    });
    }
}
export const updateSpecialization = async (req: Request, res: Response) =>{
    try {
        const {id}=req.params;
        const UC=container.resolve(updateSpecializationUC)
        const updated=await UC.execute(id,{
            ...req.body,
            imageFile:req.file
        })
         
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Specialization not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: updated
    });
    } catch (error:any) {
       return res.status(400).json({
      success: false,
      message: error.message
    }); 
    }
}

export const getSpecializations = async (req: Request, res: Response) =>{
    try {
        const search=req.query.search ? String(req.query.search).trim():undefined;
        const UC=container.resolve(getSpecializationsUC)
        const sp=await UC.execute(search);
        return res.status(200).json({
            success:true,
            data:sp
        })
    } catch (error:any) {
         return res.status(400).json({
      success: false,
      message: error.message
    });
    }
}

export const deleteSpecialization = async (req: Request, res: Response) => {
    try {
        const {id}=req.params
        const UC=container.resolve(DeleteSpecializationUC)
        const success=await UC.execute(id)
        if(!success){
            return res.status(404).json({
                success:false,
                message:"specialization not found"
            })
        }
        return res.status(200).json({
            success:true,
            message:"specialization deleted successfully"
        })

    } catch (error :any) {
         return res.status(400).json({
      success: false,
      message: error.message
    });
    }
}