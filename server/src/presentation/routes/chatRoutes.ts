// server/src/routes/ChatRouter.ts
import { Router } from 'express';
import { container } from 'tsyringe';
import { ChatController } from '../controllers/ChatController/ChatController';
import { authGuard } from '../middlewares/AuthMiddleware';
import { doctorAuthGuard } from '../middlewares/DoctorAuthGuard';
import { chatAuthGuard } from '../middlewares/chatAuthGuard';

const ChatRouter = Router();
const chatController = container.resolve(ChatController);
ChatRouter.post('/chat/rooms/find-or-create', chatAuthGuard, chatController.findOrCreateChatRoom);
ChatRouter.get('/chat/search', chatAuthGuard, chatController.searchUsers);
export default ChatRouter;