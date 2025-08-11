import { injectable, inject } from 'tsyringe';
import { IApplicantRepository } from '../../domain/repositories/applicantRepository-method';
import { IDoctorRepository } from '../../domain/repositories/DoctorRepository-method';
import { ISpecializationRepository } from '../../domain/repositories/specializationRepository-method';
import { EmailService } from '../../infrastructure/email/email_service';
import { CloudinaryService } from '../../infrastructure/services/CloudinaryService';
import { Doctor } from '../../domain/entities/Doctor.entity';
import { HashService } from '../service/HashService';
import mongoose, { Types } from 'mongoose';

interface CreateDoctorData {
  name: string;
  email: string;
  phone: string;
  registerNo: string;
  specializationId: string;
  experience: number;
  languages: string[];
  licensedState: string;
  idProof: string;
  resume: string;
  gender?: string;
  dateOfBirth?: string;
  education?: string;
  consultationFee?: number;
  profileImage?: Express.Multer.File;
}

@injectable()
export class CreateDoctorFromApplicationUC {
  constructor(
    @inject('IApplicantRepository') private applicantRepo: IApplicantRepository,
    @inject('IDoctorRepository') private doctorRepo: IDoctorRepository,
    @inject('ISpecializationRepository') private specializationRepo: ISpecializationRepository,
    private emailService: EmailService,
    @inject('CloudinaryService') private cloudinaryService: CloudinaryService,
    @inject('HashService') private hashService: HashService
  ) {}

  async execute(applicationId: string, data: CreateDoctorData): Promise<Doctor> {
    console.log('Creating doctor for application:', applicationId, 'with data:', data);
    const application = await this.applicantRepo.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }
    if (application.status !== 'approved') {
      throw new Error('Application must be approved before creating doctor');
    }
    // const existingDoctor = await this.doctorRepo.findByEmail(data.email);
    // if (existingDoctor) {
    //   throw new Error('Doctor with this email already exists');
    // }
    const specialization = await this.specializationRepo.findById(data.specializationId);
    if (!specialization) {
      throw new Error('Invalid specialization selected');
    }
    let profileImageUrl: string | undefined;
    if (data.profileImage) {
      profileImageUrl = await this.cloudinaryService.uploadImage(data.profileImage, 'doctor-profiles');
    }

    const randomPassword = Math.random().toString(36).slice(-8);
    console.log('Generated temporary password for doctor:', randomPassword); 
    const hashedPassword = await this.hashService.hash(randomPassword);
// ti268ctl -das password
    const doctorData: Omit<Doctor, 'id'> = {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      registerNo: data.registerNo,
      specialization: new mongoose.Types.ObjectId(data.specializationId),
      experience: data.experience,
      languages: data.languages,
      licensedState: data.licensedState,
      idProof: data.idProof,
      resume: data.resume,
      profileImage: profileImageUrl,
      status: 'approved',
      isBlocked: false,
      gender: data.gender as 'male' | 'female' | 'other' | undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      education: data.education,
      consultationFee: data.consultationFee,
    };
    const doctor = await this.doctorRepo.create(doctorData);

    await this.emailService.sendEmail(
      doctor.email,
      'Welcome to Med360 - Your Doctor Account Credentials',
      `
        <h2>Dear ${doctor.name},</h2>
        <p>Congratulations! Your application to become a doctor on the Med360 platform has been approved.</p>
        <p>Your account has been created. You can log in to the doctor panel using the following credentials:</p>
        <p><strong>Email:</strong> ${doctor.email}</p>
        <p><strong>Password:</strong> ${randomPassword}</p>
        <p>Please log in at <a href="http://localhost:5173/doctor/login">Doctor Portal</a> and change your password upon first login.</p>
        <p>For any questions, please contact our support team.</p>
      `
    );
    return doctor;
  }
}