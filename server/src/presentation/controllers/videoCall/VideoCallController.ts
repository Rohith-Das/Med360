import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { CreateVideoCallSessionUC } from '../../../application/videocallUC/CreateVideoCallSessionUC';
import { JoinVideoCallUC } from '../../../application/videocallUC/JoinVideoCallUC';
import { EndVideoCallUC } from '../../../application/videocallUC/EndVideoCallUC';
import { AuthRequest } from '../../middlewares/AuthRequest';

export class VideoCallController {
  async initiate(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { appointmentId } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role as 'doctor' | 'patient';
      if (!userId || !userRole) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const createUC = container.resolve(CreateVideoCallSessionUC);
      const session = await createUC.execute(appointmentId, userId, userRole);

      return res.status(201).json({ success: true, data: session });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async join(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role as 'doctor' | 'patient';
      if (!userId || !userRole) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const joinUC = container.resolve(JoinVideoCallUC);
      const session = await joinUC.execute(roomId, userId, userRole);

      return res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async end(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const endUC = container.resolve(EndVideoCallUC);
      const session = await endUC.execute(roomId, userId);

      return res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}