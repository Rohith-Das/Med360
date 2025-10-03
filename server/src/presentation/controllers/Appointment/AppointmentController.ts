import { Request, Response } from "express";
import { GetAppointmentUC } from "../../../application/Appointment/GetAppointment";
import { container } from "tsyringe";
import { AuthRequest } from "../../middlewares/AuthRequest";
import { success } from "zod";
import { CancelAppointmentUC } from "../../../application/Appointment/CancelAppointmentUC";
import { IChatRepository } from "../../../domain/repositories/ChatRepository";

export class AppointmentController {
  async getAppointments(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const patientId = req.user?.userId;
      console.log(patientId)
      if (!patientId) {
        throw new Error('patient not found')
      }
      const getAppointments = container.resolve(GetAppointmentUC)
      const appointments = await getAppointments.execute(patientId)

      const transFormedAppointments = appointments.map(apt => ({
        ...apt,
        doctorId: apt.doctorId ? {
          name: (apt.doctorId as any).name,
          specialization: (apt.doctorId as any).specialization
        } : undefined
      }))
      return res.status(200).json({
        success: true,
        message: 'fetch appointment',
        data: transFormedAppointments
      })

    } catch (error: any) {
      console.error('Get appointments error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve appointments',
      });
    }
  }

  async cancelAppointment(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { appointmentId } = req.params;
      const { reason } = req.body;
      const patientId = req.user?.userId;

      if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });

      }
      const cancelAppointmentUC = container.resolve(CancelAppointmentUC)
      const result = await cancelAppointmentUC.execute(appointmentId, patientId, reason)
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          refunded: result.refunded
        }
      })
    } catch (error: any) {
      console.error('Cancel appointment error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel appointment',
      });
    }
  }
  async getAppointmentById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { appointmentId } = req.params;
      const patientId = req.user?.userId;
      if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const getAppointmentUC = container.resolve(GetAppointmentUC);
      const appointments = await getAppointmentUC.execute(patientId)
      const appointment = appointments.find(apt => apt.id == appointmentId)
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Appointment retrieved successfully',
        data: appointment
      });

    } catch (error: any) {
      console.error('Get appointment by ID error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve appointment',
      });
    }
  }
}