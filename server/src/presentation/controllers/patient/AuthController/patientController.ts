import { Request, Response } from "express";
import { container } from "tsyringe";
import { validationResult } from "express-validator";
import { PatientRegistrationUC } from "../../../../application/patients/usecase/AuthUseCase/patientRegisterUC";
import { Patient } from "../../../../domain/entities/patient.entity";

export const registerPatientController = async (req: Request, res: Response): Promise<Response> => {
  const errors = validationResult(req);
console.log("📥 Incoming request to /register");

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
console.log("Received register request:", req.body);

  const { name, mobile, email, password } = req.body;
  if (!name || !email || !mobile || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const useCase = container.resolve(PatientRegistrationUC);

    const registeredPatient: Patient = await useCase.execute({
      name,
      mobile,
      email,
      password,
      isVerified: false,
      role: 'patient', 
       isBlocked: false,
  isDeleted: false,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent to your email.",
      data: {
        id: registeredPatient.id,
        name: registeredPatient.name,
        email: registeredPatient.email,
        mobile: registeredPatient.mobile,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};
