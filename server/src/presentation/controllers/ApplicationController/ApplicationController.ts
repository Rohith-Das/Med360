import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { SubmitApplicationUC } from '../../../application/ApplicantUC/SubmitApplicationUC';
import { getSpecializationsUC } from '../../../application/admin/usecase/specialization/getSpecializationsUC';
import { ListApplicationUC } from '../../../application/ApplicantUC/ListApplicationUC';
import { GetApplicationByIdUC } from '../../../application/ApplicantUC/GetApplicationBtIdUC';
import { ApproveApplicationUC } from '../../../application/ApplicantUC/ApproveApplicationUC';
import { RejectApplicationUC } from '../../../application/ApplicantUC/RejectApplicationUC';
import { CreateDoctorFromApplicationUC } from '../../../application/doctors/CreateDoctorFromApplicationUC';

export class ApplicationController {
  async getSpecializationsApp(req: Request, res: Response): Promise<void> {
    try {
      const useCase = container.resolve(getSpecializationsUC);
      const spec = await useCase.execute();
      console.log(spec);
      res.status(200).json({
        success: true,
        message: 'specialization fetch successfully',
        data: spec,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        data: null,
      });
    }
  }

  async submitApplicationController(req: Request, res: Response): Promise<void> {
    try {
      const useCase = container.resolve(SubmitApplicationUC);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files?.idProof?.[0] || !files?.resume?.[0]) {
        res.status(400).json({
          success: false,
          message: 'Both ID proof and resume files are required',
          data: null,
        });
        return;
      }
      const { name, email, phone, registerNo, experience, languages, specializationId, licensedState } = req.body;
      if (!name || !email || !phone || !registerNo || !experience || !specializationId || !licensedState) {
        res.status(400).json({
          success: false,
          message: 'All required fields must be provided',
          data: null,
        });
        return;
      }
      let parsedLanguages: string[] = [];
      try {
        parsedLanguages = typeof languages === 'string' ? JSON.parse(languages) : Array.isArray(languages) ? languages : [];
      } catch (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid languages format',
          data: null,
        });
        return;
      }
      if (parsedLanguages.length === 0) {
        res.status(400).json({
          success: false,
          message: 'At least one language is required',
          data: null,
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
        resumeFile: files.resume[0],
      };
      if (isNaN(applicationData.experience) || applicationData.experience < 0) {
        res.status(400).json({
          success: false,
          message: 'Experience must be a valid positive number',
          data: null,
        });
        return;
      }
      const application = await useCase.execute(applicationData);
      res.status(201).json({
        success: true,
        message: 'Application submitted successfully. You will be notified once it is reviewed.',
        data: application,
      });
    } catch (error: any) {
      console.error('Submit application error:', error);
      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message,
          data: null,
        });
      } else if (error.message.includes('Invalid specialization')) {
        res.status(400).json({
          success: false,
          message: error.message,
          data: null,
        });
      } else if (error.message.includes('upload')) {
        res.status(400).json({
          success: false,
          message: 'Failed to upload files. Please try again.',
          data: null,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error. Please try again later.',
          data: null,
        });
      }
    }
  }

  async listApplicationsController(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search ? String(req.query.search).trim() : undefined;
      const useCase = container.resolve(ListApplicationUC);
      const { applications, totalPages } = await useCase.execute(page, limit, status, search);
      res.status(200).json({
        success: true,
        message: 'Application fetched successfully',
        data: {
          applications,
          currentPage: page,
          totalPages,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        data: null,
      });
    }
  }

  async getApplicationByIdController(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const useCase = container.resolve(GetApplicationByIdUC);
      const application = await useCase.execute(id);
      if (!application) {
        res.status(404).json({
          success: false,
          message: 'Application not found',
          data: null,
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Application fetched successfully',
        data: application,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        data: null,
      });
    }
  }

  async approveApplicationController(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const useCase = container.resolve(ApproveApplicationUC);
      const application = await useCase.execute(id);
      console.log('Approved application for email:', application.email); // Log approval email
      res.status(200).json({
        success: true,
        message: 'Application approved successfully',
        data: application,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        data: null,
      });
    }
  }

  async rejectApplication(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const useCase = container.resolve(RejectApplicationUC);
      const application = await useCase.execute(id);
      res.status(200).json({
        success: true,
        message: 'application rejected',
        data: application,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        data: null,
      });
    }
  }

  async createDoctorFromApplication(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        phone,
        registerNo,
        specializationId,
        experience,
        languages,
        licensedState,
        idProof,
        resume,
        gender,
        dateOfBirth,
        education,
        consultationFee,
      } = req.body;
      const profileImage = req.file;

      console.log('Received create doctor request:', { id, data: req.body, file: profileImage });

      let parsedLanguages: string[] = [];
      try {
        parsedLanguages = typeof languages === 'string' ? JSON.parse(languages) : Array.isArray(languages) ? languages : [];
      } catch (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid languages format',
          data: null,
        });
        return;
      }

      const useCase = container.resolve(CreateDoctorFromApplicationUC);
      const doctor = await useCase.execute(id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        registerNo: registerNo.trim(),
        specializationId: specializationId.trim(),
        experience: parseInt(experience),
        languages: parsedLanguages,
        licensedState: licensedState.trim(),
        idProof,
        resume,
        gender,
        dateOfBirth,
        education,
        consultationFee: parseFloat(consultationFee),
        profileImage,
      });

      res.status(201).json({
        success: true,
        message: 'Doctor created successfully',
        data: doctor,
      });
    } catch (error: any) {
      console.error('Create doctor error:', error);
      if (error.message.includes('Application not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
          data: null,
        });
      } else if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message,
          data: null,
        });
      } else if (error.message.includes('Invalid specialization')) {
        res.status(400).json({
          success: false,
          message: error.message,
          data: null,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          data: null,
        });
      }
    }
  }
}