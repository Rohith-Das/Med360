import express from 'express';
import { ChatController } from '../controllers/ChatController/ChatController';
import { authGuard } from '../middlewares/AuthMiddleware';
import { doctorAuthGuard } from '../middlewares/DoctorAuthGuard';

const ChatRouter = express.Router();
const chatController = new ChatController();

// Common routes for both doctors and patients
ChatRouter.get('/chat-rooms', authGuard, chatController.getChatRooms);
ChatRouter.get('/chat-rooms/:chatRoomId/messages', authGuard, chatController.getMessages);
ChatRouter.put('/chat-rooms/:chatRoomId/mark-read', authGuard, chatController.markMessagesAsRead);
ChatRouter.get('/chat-rooms/:chatRoomId/unread-count', authGuard, chatController.getUnreadCount);

// Doctor-specific routes
ChatRouter.get('/doctor/chat-rooms', doctorAuthGuard, chatController.getChatRooms);
ChatRouter.get('/doctor/chat-rooms/:chatRoomId/messages', doctorAuthGuard, chatController.getMessages);
ChatRouter.put('/doctor/chat-rooms/:chatRoomId/mark-read', doctorAuthGuard, chatController.markMessagesAsRead);

export default ChatRouter;