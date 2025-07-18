import { Request, Response } from "express";
import { container } from "tsyringe";
import { AdminRegisterUC } from "../../../application/admin/usecase/adminRegisterUC";

export const adminRegisterController = async (req: Request, res: Response): Promise<Response> => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const useCase = container.resolve(AdminRegisterUC);
    const registeredAdmin = await useCase.execute({ name, email, password });

    return res.status(201).json({
      success: true,
      message: "Admin registration successful",
      data: {
        id: registeredAdmin.id,
        name: registeredAdmin.name,
        email: registeredAdmin.email,
        role: registeredAdmin.role,
      },
    });
  } catch (error: any) {
    console.error("Admin register error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Admin registration failed",
    });
  }
};