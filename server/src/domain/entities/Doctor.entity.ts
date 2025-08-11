import { ObjectId } from "mongoose";
import { Specialization } from "./specialization.entity";
import mongoose, { Types } from 'mongoose';


export interface Doctor{
    id?:string;
    name:string;
    email:string;
    password:string;
    phone:string;
    registerNo:string;
    specialization: Types.ObjectId | Specialization;
  experience: number;
  languages: string[];
  licensedState: string;
    profileImage?: string;
  status?: 'pending' | 'approved' | 'rejected';
  isBlocked?: boolean;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  education?: string;
  consultationFee?: number;
  createdAt?: Date;
  updatedAt?: Date;
  idProof:string;
    resume:string;
     refreshToken?: string;
  refreshTokenExpiresAt?: Date;
    
}