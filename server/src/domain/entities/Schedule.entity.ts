// src/domain/entities/Schedule.entity.ts
import { Types } from 'mongoose';

export interface TimeSlot {
  id?: string;
  startTime: string; 
  endTime: string;   
  isBooked: boolean;
  isActive:boolean;
    patientId?: Types.ObjectId;
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