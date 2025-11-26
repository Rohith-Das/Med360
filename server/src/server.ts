import "reflect-metadata";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
 dotenv.config();
import { createServer } from "http";
import { mongoDBClient } from "./infrastructure/database/mongoDB/mongoDBClient";
import PatientRouter from "./presentation/routes/patientRoutes";
import "./infrastructure/config/container";
import { container } from "tsyringe";
import AdminRouter from "./presentation/routes/adminRoutes";
import path=require('path')
import AppRouter from "./presentation/routes/ApplicationRoutes";
import DoctorRouter from "./presentation/routes/DoctorRoutes";
import ScheduleRouter from "./presentation/routes/ScheduleRoutes";
import PaymentRouter from "./presentation/routes/PaymentRoutes";
import VideoCallRouter from "./presentation/routes/VideoCallRoutes";
import { initializeSocketServer } from "./infrastructure/socket/socketServer";
import { ChatSocketServer } from "./infrastructure/socket/chatSocketServer";
import { ChatRouter } from "./presentation/routes/chatRoutes";
import PrescriptionRouter from "./presentation/routes/PrescriptionRoutes";


let chatSocketServerInstance: ChatSocketServer;

export const getChatSocketServer = (): ChatSocketServer => {
  if (!chatSocketServerInstance) {
    throw new Error('Chat socket server not initialized. Call startServer first.');
  }
  return chatSocketServerInstance;
};
export const startServer = async () => {
 

  const app = express();
  const httpServer=createServer(app)
  const socketServer=initializeSocketServer(httpServer)
    chatSocketServerInstance = new ChatSocketServer(socketServer.getIO());
  console.log('✅ Chat Socket Server initialized');

  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
 
  app.use(express.json());
  app.use(cookieParser());


  app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});
  const PORT = process.env.PORT || 5001;
  
  app.use("/api/patient", PatientRouter);
  app.use("/api/admin",AdminRouter)
  app.use("/api/application", AppRouter); 
 app.use("/api/doctor", DoctorRouter);
app.use('/api/schedules', ScheduleRouter);
app.use("/api/payment", PaymentRouter);
app.use('/api/videocall', VideoCallRouter);
app.use('/api/chat', ChatRouter);
app.use('/api/prescriptions', PrescriptionRouter);


app.get('/api/socket-status',(req,res)=>{
  const mainStats=socketServer.getSocketStats();
  const chatStats = chatSocketServerInstance.getChatStats();

 res.json({
      success: true,
      data: {
        mainSocket: {
          ...mainStats,
          path: '/socket.io',
          description: 'Main socket for video calls and notifications'
        },
        chatSocket: {
          ...chatStats,
          path: '/chat',
          description: 'Chat socket for real-time messaging'
        },
        server: {
          port: PORT,
          environment: process.env.NODE_ENV || 'development'
        },
        timestamp: new Date().toISOString()
      }
    });
  });

  const dbClient = container.resolve(mongoDBClient);
  await dbClient.connect();
app.use(express.static(path.join(__dirname, '../../client/build')));

  httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏥 Med360 Server Started Successfully                   ║
║                                                           ║
║   🌐 Server:        http://localhost:${PORT}              ║
║   🔌 Main Socket:   http://localhost:${PORT}/socket.io   ║
║   💬 Chat Socket:   http://localhost:${PORT}/chat        ║
║   📊 Status:        http://localhost:${PORT}/api/socket-status ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
};
