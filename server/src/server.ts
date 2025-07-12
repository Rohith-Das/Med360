import 'reflect-metadata';
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv'
import { mongoDBClient } from './infrastructure/database/mongoDB/mongoDBClient';
import PatientRouter from './presentation/routes/patientRoutes';
import './infrastructure/config/container'

export const startServer=async()=>{
    dotenv.config()
    const app=express()
    app.use(express.json());
    app.use(cookieParser())

    const PORT=process.env.PORT || 5001;

   app.use('/api/auth',PatientRouter)

 app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

    app.listen(PORT,()=>{
        console.log(`Server is running on http://localhost:${PORT}`);
    })
}