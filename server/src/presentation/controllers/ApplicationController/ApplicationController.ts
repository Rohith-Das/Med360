import { Request,Response } from "express";
import { container } from "tsyringe";
import { SubmitApplicationUC } from "../../../application/ApplicantUC/SubmitApplicationUC";
import { getSpecializationsUC } from "../../../application/admin/usecase/specialization/getSpecializationsUC";
import { success } from "zod";
import { ListApplicationUC } from "../../../application/ApplicantUC/ListApplicationUC";
import { GetApplicationByIdUC } from "../../../application/ApplicantUC/GetApplicationBtIdUC";
export class ApplicationController{

    async getSpecializationsApp(req:Request,res:Response):Promise<void>{
        try {
            const useCase=container.resolve(getSpecializationsUC)
            const spec=await useCase.execute()
            console.log(spec)
            res.status(200).json({
                success:true,
                message:'specialization fetch successfully',
                data:spec
            })
        } catch (error:any) {
              res.status(500).json({
                success: false,
                message: error.message || 'Internal server error',
                data: null
            });
        }
    }

    async submitApplicationController(req:Request,res:Response):Promise<void>{
        try {
            const useCase=container.resolve(SubmitApplicationUC)
            const files=req.files as {[fieldname:string]:Express.Multer.File[]};
             if (!files?.idProof?.[0] || !files?.resume?.[0]) {
                res.status(400).json({
                    success: false,
                    message: 'Both ID proof and resume files are required',
                    data: null
                });
                return;
            }
             const {
                name,
                email,
                phone,
                registerNo,
                experience,
                languages,
                specializationId,
                licensedState
            } = req.body;
             if (!name || !email || !phone || !registerNo || !experience || !specializationId || !licensedState) {
                res.status(400).json({
                    success: false,
                    message: 'All required fields must be provided',
                    data: null
                });
                return;
            }
              let parsedLanguages: string[] = [];
            try {
                parsedLanguages = typeof languages === 'string' 
                    ? JSON.parse(languages) 
                    : Array.isArray(languages) ? languages : [];
            } catch (error) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid languages format',
                    data: null
                });
                return;
            }
              if (parsedLanguages.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'At least one language is required',
                    data: null
                });
                return;
            }
             const applicationData = {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                registerNo: registerNo.trim(),
                experience: parseInt(experience),
                languages: parsedLanguages,
                specializationId: specializationId.trim(),
                licensedState: licensedState.trim(),
                idProofFile: files.idProof[0],
                resumeFile: files.resume[0]
            };
             if (isNaN(applicationData.experience) || applicationData.experience < 0) {
                res.status(400).json({
                    success: false,
                    message: 'Experience must be a valid positive number',
                    data: null
                });
                return;
            }
            const application=await useCase.execute(applicationData)
              res.status(201).json({
                success: true,
                message: 'Application submitted successfully. You will be notified once it is reviewed.',
                data: application
            });
        } catch (error: any) {
            console.error('Submit application error:', error);
            
            // Handle specific error cases
            if (error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                    data: null
                });
            } else if (error.message.includes('Invalid specialization')) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                    data: null
                });
            } else if (error.message.includes('upload')) {
                res.status(400).json({
                    success: false,
                    message: 'Failed to upload files. Please try again.',
                    data: null
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error. Please try again later.',
                    data: null
                });
            }
        }
    }
    async listApplicationsController(req:Request,res:Response):Promise<void>{
        try {
            const status=req.query.status as 'pending'|'approved'|'rejected'|undefined;
            const useCase=container.resolve(ListApplicationUC);
            const applications=await useCase.execute(status);
            res.status(200).json({
                success:true,
                message:"Application fetched successfully",
                data:applications
            })
        } catch (error:any) {
             res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
                data: null
            });
        }
    }

    async getApplicationByIdController(req:Request,res:Response):Promise<void>{
        try {
            const {id}=req.params;
            const useCase=container.resolve(GetApplicationByIdUC)
            const application=await useCase.execute(id)
             if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                    data: null
                });
                return;
            }
             res.status(200).json({
                success: true,
                message: "Application fetched successfully",
                data: application
            });
        } catch (error:any) {
            res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
                data: null
            });
        }
    }

    
}