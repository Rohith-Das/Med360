import "reflect-metadata";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
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

export const startServer = async () => {
  dotenv.config();

  const app = express();
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

  const dbClient = container.resolve(mongoDBClient);
  await dbClient.connect();
app.use(express.static(path.join(__dirname, '../../client/build')));

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};
