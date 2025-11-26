import { Response } from "express";
import { container, inject, injectable } from "tsyringe";
import { AuthRequest } from "../../middlewares/AuthRequest";
import { UpdatePrescriptionUC } from "../../../application/prescriptionUC/UpdatePrescriptionUC";
import { GetPrescriptionByAppointmentUC } from "../../../application/prescriptionUC/GetPrescriptionByAppointmentUC";
import { SoftDeletePrescriptionUC } from "../../../application/prescriptionUC/SoftDeletePrescriptionUC";
import { CreatePrescriptionUC } from "../../../application/prescriptionUC/CreatePrescriptionUC";
import { RedisService } from "../../../infrastructure/services/RedisService";
import { IAppointmentRepository } from "../../../domain/repositories/AppointmentRepository";
import { Types } from "mongoose";

@injectable()
export class PrescriptionController {
 constructor(
  @inject(RedisService) private readonly redisService: RedisService,
  @inject("IAppointmentRepository") private readonly appointmentRepo: IAppointmentRepository,
) {}


  async createPrescription(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const doctorId = req.user?.userId;
      if (!doctorId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { appointmentId, diagnosis, medicines, tests, notes } = req.body;

      // Validation
      if (!appointmentId || !diagnosis || !medicines || medicines.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Appointment ID, diagnosis, and at least one medicine are required'
        });
      }

      // Validate each medicine
      for (const medicine of medicines) {
        if (!medicine.name || !medicine.frequency || !medicine.duration) {
          return res.status(400).json({
            success: false,
            message: 'Each medicine must have name, frequency, and duration'
          });
        }
      }

      const UC = container.resolve(CreatePrescriptionUC);
      
    const appointment=await this.appointmentRepo.findById(appointmentId);
    
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      const prescription = await UC.execute({
        appointmentId,
        doctorId,
        patientId: appointment.patientId as string,
        diagnosis,
        medicines,
        tests,
        notes,
        isDeleted: false
      });

      // Invalidate cache
      await this.redisService.invalidatePrescriptionCache(appointmentId);

      return res.status(201).json({
        success: true,
        message: 'Prescription created successfully',
        data: prescription
      });
    } catch (error: any) {
      console.error('Create prescription error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create prescription'
      });
    }
  }

  async updatePrescription(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const doctorId = req.user?.userId;
      if (!doctorId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { prescriptionId } = req.params;
      const updates = req.body;

      const UC = container.resolve(UpdatePrescriptionUC);
      const prescription = await UC.execute(prescriptionId, updates);

      // Invalidate cache
         await this.redisService.invalidatePrescriptionCache(prescription.appointmentId.toString());
      return res.status(200).json({
        success: true,
        message: 'Prescription updated successfully',
        data: prescription
      });
    } catch (error: any) {
      console.error('Update prescription error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update prescription'
      });
    }
  }

  async getPrescriptionByAppointment(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { appointmentId } = req.params;

      // Check cache first
      const cached = await this.redisService.getCachedPrescription(appointmentId);
      if (cached) {
        return res.status(200).json({
          success: true,
          message: 'Prescription retrieved from cache',
          data: cached
        });
      }

      const UC = container.resolve(GetPrescriptionByAppointmentUC);
      const prescription = await UC.execute(appointmentId);

      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: 'Prescription not found'
        });
      }

      // Cache the result
      await this.redisService.cachePrescription(appointmentId, prescription);

      return res.status(200).json({
        success: true,
        message: 'Prescription retrieved successfully',
        data: prescription
      });
    } catch (error: any) {
      console.error('Get prescription error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve prescription'
      });
    }
  }

  async deletePrescription(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const doctorId = req.user?.userId;
      if (!doctorId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { prescriptionId } = req.params;

      const UC = container.resolve(SoftDeletePrescriptionUC);
      const result = await UC.execute(prescriptionId, doctorId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Prescription not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Prescription deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete prescription error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete prescription'
      });
    }
  }

  // Search medicine with Redis caching
  async searchMedicine(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string' || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Query must be at least 2 characters'
        });
      }

      // Check cache first
      const cached = await this.redisService.getCachedMedicineSearch(query);
      if (cached) {
        return res.status(200).json({
          success: true,
          message: 'Results from cache',
          data: cached
        });
      }

      // Fetch from external API (RxNav)
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(
        `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('External API request failed');
      }

          const data: any = await response.json();
      const suggestions = data.suggestionGroup?.suggestionList?.suggestion || [];

      // Cache the results
      await this.redisService.cacheMedicineSearch(query, suggestions);

      return res.status(200).json({
        success: true,
        message: 'Medicine search results',
        data: suggestions.slice(0, 10)
      });
    } catch (error: any) {
      console.error('Search medicine error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to search medicine'
      });
    }
  }
}