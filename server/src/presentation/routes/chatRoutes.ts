// server/src/routes/ChatRouter.ts
import { Router } from 'express';
import { container } from 'tsyringe';
import { ChatController } from '../controllers/ChatController/ChatController';
import { authGuard } from '../middlewares/AuthMiddleware';
import { doctorAuthGuard } from '../middlewares/DoctorAuthGuard';

const ChatRouter = Router();
const chatController = container.resolve(ChatController);

// Routes for chat operations
ChatRouter.post('/rooms/find-or-create', authGuard, chatController.findOrCreateChatRoom.bind(chatController));
ChatRouter.get('/search/patient', 
    authGuard,
     chatController.searchUsers.bind(chatController));
     
ChatRouter.get(
  "/search/doctor",
  doctorAuthGuard, // doctor middleware
  chatController.searchUsers.bind(chatController)
);
export default ChatRouter;