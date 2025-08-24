import { Types } from "mongoose";

export interface Wallet{
    id:string;
    patientId:string|Types.ObjectId;
    balance:number;
    currency:string;
    isActive:boolean;
    createdAt?:Date;
    updatedAt?:Date
}
export interface WalletTransaction {
  id: string;
  walletId: string | Types.ObjectId;
  patientId: string | Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  referenceId?: string; 
  referenceType?: 'appointment_refund' | 'appointment_payment' | 'top_up';
  status: 'pending' | 'completed' | 'failed';
  createdAt?: Date;
  updatedAt?: Date;
}