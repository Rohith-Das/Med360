import { Router } from "express";
import { uploadDoctorApplication } from "../../infrastructure/config/multerConfig";
import { ApplicationController } from "../controllers/ApplicationController/ApplicationController";

const AppRouter = Router();
const applicationController = new ApplicationController();

AppRouter.get('/specializations', applicationController.getSpecializationsApp);
AppRouter.post('/submit',uploadDoctorApplication,applicationController.submitApplicationController)

export default AppRouter;
