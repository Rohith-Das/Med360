// server/src/routes/ChatRouter.ts
import { Router } from 'express';
import { container } from 'tsyringe';
import { ChatController } from '../controllers/ChatController/ChatController';
import { chatAuthGuard } from '../middlewares/chatAuthGuard';

const ChatRouter = Router();
const chatController = container.resolve(ChatController);

// ✅ ALL chat routes should use chatAuthGuard
ChatRouter.post('/rooms/find-or-create', chatAuthGuard, chatController.findOrCreateChatRoom.bind(chatController));
ChatRouter.get('/search', chatAuthGuard, chatController.searchUsers.bind(chatController));
ChatRouter.get('/rooms', chatAuthGuard, chatController.getUserChatRooms.bind(chatController));
ChatRouter.get('/messages/:roomId', chatAuthGuard, chatController.getChatRoomMessages.bind(chatController));
ChatRouter.post('/messages/send', chatAuthGuard, chatController.sendMessage.bind(chatController));
ChatRouter.put('/messages/read', chatAuthGuard, chatController.markMessagesAsRead.bind(chatController));
ChatRouter.get('/unread-count', chatAuthGuard, chatController.getUnreadCount.bind(chatController));

export { ChatRouter };