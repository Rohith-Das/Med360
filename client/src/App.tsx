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


function App() {
  return (
    <Routes>
      <Route path="/" element={<FirstPage />} />
      <Route path="/login" element={<LoginPage/>}/>
       <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/home" element={<Home />} />
      <Route path="/request-password-reset-otp" element={<RequestPasswordResetPage />} />
        <Route path="/reset-password-with-otp" element={<ResetPasswordPage />} />

    </Routes>
  );
}

export default App;
