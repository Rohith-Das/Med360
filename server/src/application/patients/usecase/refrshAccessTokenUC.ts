import { inject, injectable } from 'tsyringe';
import { AuthService } from '../../service/AuthService';
import { TokenPayload } from '../../../shared/AuthType';

@injectable()
export class RefreshAccessTokenUC {
  constructor(@inject('AuthService') private authService: AuthService) {}

  async execute(refreshToken: string): Promise<string> {
    let payload: TokenPayload;

    try {
      payload = this.authService.verifyRefreshToken(refreshToken);
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    return this.authService.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    });
  }
}
