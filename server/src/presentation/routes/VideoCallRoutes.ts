
import { Router } from 'express';
import { VideoCallController } from '../controllers/videoCall/VideoCallController';
import { videoCallAuthGuard } from '../middlewares/videoCallAuthGuard';

const VideoRouter = Router();
const controller = new VideoCallController();

VideoRouter.post('/initiate', videoCallAuthGuard, controller.initiate.bind(controller));
VideoRouter.post('/join/:roomId', videoCallAuthGuard, controller.join.bind(controller));
VideoRouter.post('/end/:roomId', videoCallAuthGuard, controller.end.bind(controller));

export default VideoRouter;