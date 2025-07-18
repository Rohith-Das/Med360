import mongoose,{Schema,Document} from "mongoose";
import { Admin } from "../../../domain/entities/admin.entity";

interface AdminDocument extends Omit<Admin,"id">,Document{
  _id:string;
}

const AdminSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin'], default: 'admin' },
    refreshToken: { type: String },
    refreshTokenExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export const AdminModel=mongoose.model<AdminDocument>("Admin",AdminSchema);