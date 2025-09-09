// src/presentation/routes/VideoCallRoutes.ts
import express from 'express';
import { VideoCallController } from '../controllers/videoCall/VideoCallController';
import { authGuard } from '../middlewares/AuthMiddleware';
import { doctorAuthGuard } from '../middlewares/DoctorAuthGuard';

const VideoCallRouter = express.Router();
const videoCallController = new VideoCallController();

// Patient routes
VideoCallRouter.post('/initiate', authGuard, videoCallController.initiateCall);
VideoCallRouter.post('/join/:roomId', authGuard, videoCallController.joinCall);
VideoCallRouter.post('/end/:roomId', authGuard, videoCallController.endCall);
VideoCallRouter.get('/status/:roomId', authGuard, videoCallController.getCallStatus);

// Doctor routes (using same endpoints but with doctor auth)
VideoCallRouter.post('/doctor/initiate', doctorAuthGuard, videoCallController.initiateCall);
VideoCallRouter.post('/doctor/join/:roomId', doctorAuthGuard, videoCallController.joinCall);
VideoCallRouter.post('/doctor/end/:roomId', doctorAuthGuard, videoCallController.endCall);
VideoCallRouter.get('/doctor/status/:roomId', doctorAuthGuard, videoCallController.getCallStatus);

export default VideoCallRouter;

