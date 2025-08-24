import {
  Wallet,
  WalletTransaction,
} from "../../../domain/entities/Wallet.entity";
import mongoose, { Schema } from "mongoose";

const WalletSchema = new Schema<Wallet>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "inr" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const WalletTransactionSchema = new Schema<WalletTransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    referenceId: { type: String },
    referenceType: { 
      type: String, 
      enum: ['appointment_refund', 'appointment_payment', 'top_up'] 
    },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'], 
      default: 'completed' 
    },
  },
  { timestamps: true }
);

export const WalletModel = mongoose.model<Wallet>('Wallet', WalletSchema);
export const WalletTransactionModel = mongoose.model<WalletTransaction>('WalletTransaction', WalletTransactionSchema);
