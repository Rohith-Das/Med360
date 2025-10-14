import { Router } from 'express';
import { container } from 'tsyringe';
import { ChatController } from '../controllers/ChatController/ChatController';
import { doctorAuthGuard } from '../middlewares/DoctorAuthGuard'
import { authGuard } from '../middlewares/AuthMiddleware'

const ChatRouter = Router();


export default ChatRouter;