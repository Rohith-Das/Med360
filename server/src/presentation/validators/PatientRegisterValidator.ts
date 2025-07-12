import { body } from "express-validator";

export const patientRegisterValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^\+\d{1,4}\d{7,10}$/)
    .withMessage('Invalid mobile number format (e.g., +919876543210)'),
  body('email').trim().notEmpty().isEmail().withMessage('Invalid email address'),
  body('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];