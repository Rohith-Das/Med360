import { inject, injectable } from "tsyringe";
import { IPatientRepository } from "../../../../domain/repositories/patientRepository_method";
import { HashService } from "../../../service/HashService";
import { AuthService } from "../../../service/AuthService";

@injectable()
export class patientLoginUC {
  constructor(
    @inject("IPatientRepository") private repo: IPatientRepository,
    @inject("HashService") private hashed: HashService,
    @inject("AuthService") private authService: AuthService
  ) {}

  async execute({ email, password }: { email: string; password: string }) {
    const patient = await this.repo.findByEmail(email);
    if (!patient || !patient.password) {
      throw new Error("Invalid credentials");
    }

    const isMatch = await this.hashed.compare(password, patient.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    if (!patient.isVerified) {
      throw new Error("Please verify your email before login");
    }

    const payload = {
      userId: patient.id!,
      email: patient.email,
      name: patient.name,
      role: patient.role,
    };

    const refreshToken = this.authService.generateRefreshToken(payload);
    const accessToken = this.authService.generateAccessToken(payload);

    await this.repo.update(patient.id!, {
      refreshToken,
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
      patient: {
        id: patient.id!,
        name: patient.name,
        email: patient.email,
        mobile: patient.mobile,
        role: patient.role,
      },
    };
  }
}

