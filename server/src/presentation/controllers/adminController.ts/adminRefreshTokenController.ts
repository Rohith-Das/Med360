import { Request,Response } from "express";
import { container } from "tsyringe";
import { AdminRefreshTokenUC } from "../../../application/admin/usecase/adminRefreshTokenUC";


export const adminRefreshTokenController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const refreshToken = req.cookies.adminRefreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Admin refresh token not found' });
    }

    const useCase = container.resolve(AdminRefreshTokenUC);
    const newAccessToken = await useCase.execute(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Admin access token refreshed successfully',
      data: {
        adminAccessToken: newAccessToken,
      }
    });
  } catch (error: any) {
    console.error('Admin refresh token error:', error.message);
    return res.status(403).json({ success: false, message: error.message || 'Could not refresh admin token' });
  }
};





