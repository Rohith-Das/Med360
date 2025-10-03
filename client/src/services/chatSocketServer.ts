import { io, Socket } from "socket.io-client";
import { store } from "@/app/store";
import {
  addRealtimeMessage,
  updateOnlineUsers,
  updateTypingUsers,
  markMessagesAsRead,
  setCurrentChatRoom,
} from "@/features/chat/chatSlice";
import { toast } from "react-toastify";

export interface ChatSocketEventData {
  chatRoomId: string;
  userId?: string;
  userName?: string;
  userRole?: "doctor" | "patient";
  message?: string;
  messageType?: "text" | "image" | "file";
  messageId?: string;
  timestamp?: string;
  fileUrl?: string;
  fileName?: string;
  progress?: number;
  messageIds?: string[];
  senderId?: string;
  senderRole?: "doctor" | "patient";
}

class ChatSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private currentUserId: string | null = null;
  private currentUserRole: "doctor" | "patient" | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionListeners: ((connected: boolean) => void)[] = [];

  connect(userId: string, role: "doctor" | "patient"): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected && this.currentUserId === userId) {
        resolve(true);
        return;
      }

      if (this.socket) {
        this.disconnect();
      }

      const apiUrl =  "http://localhost:5001";
      const token =
        role === "doctor"
          ? store.getState().doctorAuth.doctorAccessToken
          : store.getState().auth.accessToken;

      if (!token) {
        reject(new Error("No authentication token available"));
        return;
      }

      this.socket = io(apiUrl, {
        path: "/chat-socket",
        withCredentials: true,
        auth: {
          token,
          userId,
          userType: role,
        },
        transports: ["websocket", "polling"],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.currentUserId = userId;
      this.currentUserRole = role;

      this.socket.on("connect", () => {
        console.log(`Connected to chat socket server as ${role}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);

        toast.success("Chat connected", {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true,
        });

        resolve(true);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Disconnected from chat socket server:", reason);
        this.isConnected = false;
        this.notifyConnectionListeners(false);

        if (reason === "io server disconnect") {
          toast.error("Chat connection closed by server", {
            position: "bottom-right",
            autoClose: 3000,
          });
        }
      });

      this.socket.on("connect_error", (error) => {
        console.error("Chat socket connection error:", error);
        this.isConnected = false;
        this.notifyConnectionListeners(false);

        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          toast.error("Failed to connect to chat", {
            position: "bottom-right",
            autoClose: 5000,
          });
          reject(new Error("Failed to connect to chat socket"));
        }
      });

      this.socket.on("reconnect", () => {
        console.log("Chat socket reconnected");
        toast.success("Chat reconnected", {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true,
        });
      });

      this.socket.on("reconnect_failed", () => {
        console.log("Chat socket reconnection failed");
        toast.error("Chat reconnection failed", {
          position: "bottom-right",
          autoClose: 3000,
        });
      });

      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("chat:new-message", (data: ChatSocketEventData) => {
      console.log("New chat message received:", data);
      store.dispatch(addRealtimeMessage(data));

      const currentChatRoomId = store.getState().chat.currentChatRoomId;
      if (data.chatRoomId !== currentChatRoomId && data.userId !== this.currentUserId) {
        const senderName = data.userName || (data.userRole === "doctor" ? "Doctor" : "Patient");
        const participantId = data.chatRoomId.split("_")[data.userRole === "doctor" ? 1 : 0];
        toast.info(`New message from ${senderName}`, {
          position: "top-right",
          autoClose: 4000,
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("navigate_to_chat", {
                detail: { participantId },
              })
            );
          },
        });
      }
    });

    this.socket.on("chat:user-online", (data: ChatSocketEventData) => {
      console.log("User came online:", data);
      if (data.userId && data.userId !== this.currentUserId) {
        store.dispatch(updateOnlineUsers({ userId: data.userId, isOnline: true }));
      }
    });

    this.socket.on("chat:user-offline", (data: ChatSocketEventData) => {
      console.log("User went offline:", data);
      if (data.userId && data.userId !== this.currentUserId) {
        store.dispatch(updateOnlineUsers({ userId: data.userId, isOnline: false }));
      }
    });

    this.socket.on("chat:user-joined", (data: ChatSocketEventData) => {
      console.log("User joined chat room:", data);
      if (data.userId !== this.currentUserId) {
        const userName = data.userName || "User";
        toast.info(`${userName} joined the chat`, {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    });

    this.socket.on("chat:user-left", (data: ChatSocketEventData) => {
      console.log("User left chat room:", data);
    });

    this.socket.on("chat:user-typing", (data: ChatSocketEventData) => {
      console.log("User started typing:", data);
      if (data.userId && data.userId !== this.currentUserId) {
        store.dispatch(updateTypingUsers({ userId: data.userId, isTyping: true }));

        setTimeout(() => {
          store.dispatch(updateTypingUsers({ userId: data.userId!, isTyping: false }));
        }, 5000);
      }
    });

    this.socket.on("chat:user-stopped-typing", (data: ChatSocketEventData) => {
      console.log("User stopped typing:", data);
      if (data.userId && data.userId !== this.currentUserId) {
        store.dispatch(updateTypingUsers({ userId: data.userId, isTyping: false }));
      }
    });

    this.socket.on("chat:messages-read", (data: ChatSocketEventData) => {
      console.log("Messages marked as read:", data);
      if (data.chatRoomId && data.userId !== this.currentUserId) {
        store.dispatch(
          markMessagesAsRead({
            participantId:data.chatRoomId,
            userId: data.userId!,
            role: this.currentUserRole!,
          })
        );
      }
    });

    this.socket.on("chat:file-upload-progress", (data: ChatSocketEventData) => {
      console.log("File upload progress:", data);
      if (data.progress !== undefined) {
        window.dispatchEvent(
          new CustomEvent("chat_file_upload_progress", {
            detail: data,
          })
        );
      }
    });

    this.socket.on("chat:file-upload-complete", (data: ChatSocketEventData) => {
      console.log("File upload complete:", data);
      toast.success("File uploaded successfully", {
        position: "bottom-right",
        autoClose: 2000,
      });
      store.dispatch(addRealtimeMessage(data));
    });

    this.socket.on("chat:room-joined", (data: { chatRoomId: string }) => {
      console.log("Successfully joined chat room:", data);
      store.dispatch(setCurrentChatRoom(data.chatRoomId));
    });

    this.socket.on("chat:error", (error: any) => {
      console.error("Chat socket error:", error);
      toast.error(error.message || "Chat connection error", {
        position: "bottom-right",
        autoClose: 3000,
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUserId = null;
      this.currentUserRole = null;
      this.notifyConnectionListeners(false);
      console.log("Chat socket disconnected");
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  onConnectionChange(listener: (connected: boolean) => void) {
    this.connectionListeners.push(listener);
    listener(this.isConnected);

    return () => {
      this.connectionListeners = this.connectionListeners.filter((l) => l !== listener);
    };
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (error) {
        console.error("Error in connection listener:", error);
      }
    });
  }

  joinChatRoom(chatRoomId: string) {
    if (this.socket?.connected) {
      console.log(`Joining chat room: ${chatRoomId}`);
      this.socket.emit("chat:join-room", { chatRoomId });
    } else {
      console.warn(`Cannot join chat room ${chatRoomId}: socket not connected`);
    }
  }

  leaveChatRoom(chatRoomId: string) {
    if (this.socket?.connected) {
      console.log(`Leaving chat room: ${chatRoomId}`);
      this.socket.emit("chat:leave-room", { chatRoomId });
    } else {
      console.warn(`Cannot leave chat room ${chatRoomId}: socket not connected`);
    }
  }

  sendMessage(
    chatRoomId: string,
    message: string,
    messageType: "text" | "image" | "file" = "text",
    additionalData?: { fileUrl?: string; fileName?: string }
  ) {
    if (this.socket?.connected) {
      const messageData: ChatSocketEventData = {
        chatRoomId,
        message,
        messageType,
        messageId: `temp_${Date.now()}_${this.currentUserId}`,
        senderId: this.currentUserId!,
        senderRole: this.currentUserRole!,
        ...additionalData,
      };

      console.log(`Sending message to room ${chatRoomId}:`, messageData);
      this.socket.emit("chat:send-message", messageData);
      store.dispatch(
        addRealtimeMessage({
          ...messageData,
          timestamp: new Date().toISOString(),
        })
      );
    } else {
      console.warn(`Cannot send message: socket not connected`);
      throw new Error("Chat not connected");
    }
  }

  startTyping(chatRoomId: string) {
    if (this.socket?.connected) {
      this.socket.emit("chat:typing-start", { chatRoomId });
    }
  }

  stopTyping(chatRoomId: string) {
    if (this.socket?.connected) {
      this.socket.emit("chat:typing-stop", { chatRoomId });
    }
  }

  markMessagesAsRead(chatRoomId: string, messageIds?: string[]) {
    if (this.socket?.connected) {
      this.socket.emit("chat:mark-message-read", {
        chatRoomId,
        messageIds,
        timestamp: new Date().toISOString(),
      });
    }
  }

  reportFileUploadProgress(chatRoomId: string, progress: number, fileName: string) {
    if (this.socket?.connected) {
      this.socket.emit("chat:file-upload-progress", {
        chatRoomId,
        progress,
        fileName,
      });
    }
  }

  reportConnectionQuality(quality: "poor" | "fair" | "good" | "excellent") {
    if (this.socket?.connected) {
      this.socket.emit("chat:connection-quality", { quality });
    }
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  getCurrentUserRole(): "doctor" | "patient" | null {
    return this.currentUserRole;
  }

  getConnectionStats() {
    return {
      connected: this.isConnected,
      userId: this.currentUserId,
      userRole: this.currentUserRole,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
    };
  }
}

export const chatSocketService = new ChatSocketService();