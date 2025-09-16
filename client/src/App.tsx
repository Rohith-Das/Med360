import { Routes, Route } from "react-router-dom";
import FirstPage from "./pages/patientPages/FirstPage";
import { ProtectedRoute } from "./components/patient/ProtectedRoute";
import { LoginPage } from "./pages/patientPages/LoginPage";
import Dashboard from "./pages/patientPages/Home";
import { RegisterPage } from "./pages/patientPages/RegisterPage";
import { VerifyOtpPage } from "./pages/patientPages/VerifyOtpPage";
import { AdminLoginPage } from "./pages/adminPages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/adminPages/AdminDashboardPage";
import { RequestPasswordResetPage } from "./pages/patientPages/forgotPasswordPages/RequestPasswordResetPage ";
import { ResetPasswordPage } from "./pages/patientPages/forgotPasswordPages/ResetPasswordPage ";
import Home from "./pages/patientPages/Home";
import ListPatients from "./pages/adminPages/ListPatients";
import { GuestRoute } from "./components/patient/GuestRoutes";
import ProfilePage from "./pages/patientPages/PatientProfile";
import SpecializationList from "./pages/adminPages/SpecializationList";
import SpecializationForm from "./pages/adminPages/SpecializationForm";
import DoctorApplicationPage from "./pages/Applications/DoctorApplicationPage";
import ApplicationsPage from "./pages/adminPages/Application";
import DoctorCreatePage from "./pages/doctorPages/DoctorCreatePage";
import DoctorLoginPage from "./pages/doctorPages/DoctorLoginPage";
import ListDoctors from "./pages/adminPages/ListDoctors";
import DoctorsBySpecialization from "./pages/patientPages/DoctorsBySpecialization";
import DoctorTimeSlot from "./pages/doctorPages/DoctorTimeSlot";
import DoctorProfile from "./pages/doctorPages/DoctorProfile";
import BookSummaryPage from "./pages/patientPages/BookSummaryPage";
import PaymentPage from "./pages/patientPages/PaymentPage";
import PaymentSuccessPage from "./pages/patientPages/PaymentSuccessPage";
import ViewAppointment from "./pages/patientPages/viewAppointment";
import WalletPage from "./pages/patientPages/WalletPage";
import DoctorNotificationsPage from "./features/Doctor/DoctorNotificationsPage";
import DoctorAppointments from "./pages/doctorPages/DoctorAppointmentList";
import PatientNotificationsPage from "./pages/patientPages/PatientNotificationsPage";


function App() {
  return (
    <Routes>
      <Route path="/" element={<FirstPage />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
            <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
 
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/home" element={<Home />} />
      <Route
        path="/request-password-reset-otp"
        element={<RequestPasswordResetPage />}
      />
      <Route path="/reset-password-with-otp" element={<ResetPasswordPage />} />
      <Route path="/admin/patients" element={<ListPatients />} />

      <Route path="/admin/specializations" element={<SpecializationList />} />
<Route path="/admin/specializations/create" element={<SpecializationForm />} />
<Route path="/admin/specializations/edit/:id" element={<SpecializationForm />} />
<Route path="/become-doctor" element={<DoctorApplicationPage/>}/>


<Route path="/admin/applications" element={<ApplicationsPage/>}/>
      <Route path="/admin/doctors/create/:applicationId" element={<DoctorCreatePage />} />
<Route path="/doctor/login" element={<DoctorLoginPage />} />
 <Route path="/admin/doctors" element={<ListDoctors />} />
 <Route path="/specialization/:specializationId" element={<DoctorsBySpecialization />} />
<Route path="/doctor/time-slots" element={<DoctorTimeSlot />} />
<Route path="/doctor/profile" element={<DoctorProfile/>}/>
 <Route
        path="/book-summary"
        element={
          <ProtectedRoute>
            <BookSummaryPage />
          </ProtectedRoute>
        }
      />
      <Route path="/payment" element={<PaymentPage />} />
<Route path="/payment/success" element={<PaymentSuccessPage />} />
<Route path="/appointments" element={<ViewAppointment />} />
<Route path="/wallet" element={<WalletPage />} />
 <Route path="/doctor/notifications" element={<DoctorNotificationsPage/>}/> 
  <Route path="/notifications" element={<PatientNotificationsPage/>}/> 
 <Route path="/doctor/appointments" element={<DoctorAppointments />} />

    </Routes>
  );
}



export default App;
