import { Request } from "express";
import { TokenPayload } from "../../shared/AuthType";
export interface AuthRequest extends Request {
  user?: TokenPayload;
}