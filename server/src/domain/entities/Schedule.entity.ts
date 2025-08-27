// src/domain/entities/Schedule.entity.ts
import mongoose, { Types } from 'mongoose';

export interface TimeSlot {
  id?: string;
  _id?:mongoose.Types.ObjectId;
  startTime: string; 
  endTime: string;   
  isBooked: boolean;
  isActive:boolean;
    patientId?: string | mongoose.Types.ObjectId | null;
}

export interface Schedule {
  id?: string;
  _id?:string;
  doctorId: Types.ObjectId | string;
  date: Date;
  timeSlots: TimeSlot[];
  createdAt?: Date;
  updatedAt?: Date;
   isActive: boolean;
}