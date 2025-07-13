import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { RefreshAccessTokenUC } from '../../../application/patients/usecase/refrshAccessTokenUC';

export const refreshTokenController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token not found' });
    }

    const useCase = container.resolve(RefreshAccessTokenUC);
    const newAccessToken = await useCase.execute(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    console.error('Refresh token error:', error.message);
    return res.status(403).json({ success: false, message: error.message || 'Could not refresh token' });
  }
};
