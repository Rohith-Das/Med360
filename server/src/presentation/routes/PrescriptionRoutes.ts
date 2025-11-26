// server/src/presentation/routes/PrescriptionRoutes.ts
import express from 'express';
import { PrescriptionController } from '../controllers/doctorsControllers/PrescriptionController';
import { doctorAuthGuard } from '../middlewares/DoctorAuthGuard';
import { container } from 'tsyringe';

const PrescriptionRouter = express.Router();

// Resolve dependencies via tsyringe
const prescriptionController = container.resolve(PrescriptionController);

// Bind context
PrescriptionRouter.post(
  '/',
  doctorAuthGuard,
  prescriptionController.createPrescription.bind(prescriptionController)
);

PrescriptionRouter.put(
  '/:prescriptionId',
  doctorAuthGuard,
  prescriptionController.updatePrescription.bind(prescriptionController)
);

PrescriptionRouter.get(
  '/appointment/:appointmentId',
  doctorAuthGuard,
  prescriptionController.getPrescriptionByAppointment.bind(prescriptionController)
);

PrescriptionRouter.delete(
  '/:prescriptionId',
  doctorAuthGuard,
  prescriptionController.deletePrescription.bind(prescriptionController)
);

PrescriptionRouter.get(
  '/medicine/search',
  doctorAuthGuard,
  prescriptionController.searchMedicine.bind(prescriptionController)
);

export default PrescriptionRouter;
