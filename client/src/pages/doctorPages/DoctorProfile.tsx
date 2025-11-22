import { useEffect,useContext, useState } from "react";
import { useAppDispatch,useAppSelector } from "@/app/hooks";
import { fetchDoctorProfile } from "@/features/profile/DoctorThunk";
import { useNavigate } from "react-router-dom";
import { toast ,ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DoctorNavbar from "@/components/doctor/DoctorNavbar";
import { fetchSpecializations } from "@/features/specialization/specializationSlice";

interface Specialization {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}


interface DoctorFormData {
 
  name: string;
  email: string;
//   password?: string;
  phone: string;
  registerNo: string;
  specialization: string; 
  experience: number;
  languages: string[];
  licensedState: string;
  profileImage?: string;
//   isBlocked?: boolean;
  dateOfBirth?: string; 
  education?: string;
//    loading: boolean;
//   error: string | null;
//   consultationFee?: number;
//   createdAt?: string;
//   updatedAt?: string;
//   idProof: string;
//   resume: string;
//   refreshToken?: string;
//   refreshTokenExpiresAt?: string;
}

const DoctorProfile=()=>{

    const dispatch=useAppDispatch();
    const navigate=useNavigate();
    const {profile,loading,error}=useAppSelector((state)=>state.doctorAuth.doctorProfile)
    const {doctor}=useAppSelector((state)=>state.doctorAuth.doctorAuth)

    const [formData,setFormData]=useState<DoctorFormData>({
        email:"",
        experience:0,
        languages:[],
         licensedState:"",
         name:"",
         phone:"",
         registerNo:"",
         specialization:"",
         dateOfBirth:"",
         education:"",
         profileImage:"",
    })
    useEffect(()=>{
        dispatch(fetchDoctorProfile())
    },[dispatch])

    useEffect(()=>{
        if(profile){
            setFormData({
                name:profile.name,
                email:profile.email,
                experience:profile.experience,
                languages:profile.languages,
                licensedState:profile.licensedState,
                phone:profile.phone,
                registerNo:profile.registerNo,
                specialization:profile.specialization,
                dateOfBirth:profile.dateOfBirth,
                education:profile.education,
                profileImage:profile.profileImage,

            })
        }
    },[profile])
     if (!profile) {
    return <div className="p-6 text-center">No profile found.</div>;
  }
    return(
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <img
          src={profile.profileImage || "/default-avatar.png"}
          alt={profile.name}
          className="w-32 h-32 rounded-full object-cover border"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-gray-600">{profile.email}</p>
          <p className="text-gray-600">{profile.phone}</p>
          <p className="mt-2">
            <strong>Specialization:</strong> {profile.specialization.name}
          </p>

          <p>
            <strong>Experience:</strong> {profile.experience} years
          </p>
          <p>
            <strong>Languages:</strong> {profile.languages.join(", ")}
          </p>
          <p>
            <strong>Licensed State:</strong> {profile.licensedState}
          </p>
          {profile.education && (
            <p>
              <strong>Education:</strong> {profile.education}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-4">
      
      </div>
    </div>
    )
}
export default DoctorProfile