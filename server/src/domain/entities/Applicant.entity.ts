import { ObjectId } from "mongoose";
import mongoose, { Types } from 'mongoose';

import { Specialization } from "./specialization.entity";

export interface Applicant  {
    id?: string;
    name:string;
    email:string;
    phone:string;
    registerNo:string;
    specialization: Types.ObjectId | Specialization;

    languages:string[];
    experience:number;
    licensedState:string;
    idProof:string;
    resume:string;
     status?: "pending" | "approved" | "rejected";
      createdAt?: Date;
  updatedAt?: Date;
}