export interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  registerNo: string;
  specialization?: {
    id: string;
    name: string;
  };
  idProof: string;
  resume: string;
  experience: number;
   languages: string[];
  licensedState: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}