import { body } from 'express-validator';

export const patientLoginValidator = [
    body('email').trim().notEmpty().isEmail().withMessage('Invalid email address'),
    body('password').trim().notEmpty().withMessage('Password is required'),
];