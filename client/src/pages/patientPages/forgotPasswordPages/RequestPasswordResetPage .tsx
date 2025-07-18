// C:\Users\devro\OneDrive\Desktop\Med360\client\src\pages\patientPages\RequestPasswordResetPage.tsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { requestPasswordResetOtp } from "../../../features/auth/authThunks";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const RequestPasswordResetPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      await dispatch(requestPasswordResetOtp(email)).unwrap();
      toast.success("OTP sent to your email. Please check your inbox.");
      navigate(`/reset-password-with-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
      <p className="mb-4">Enter your email to receive a password reset OTP</p>
      
      <div className="mb-4">
        <label className="block mb-2">Email</label>
        <input
          type="email"
          className="w-full p-2 border rounded"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        onClick={handleSubmit}
        disabled={loading || !email}
      >
        {loading ? "Sending..." : "Send OTP"}
      </button>

      <div className="mt-4 text-center">
        <button 
          className="text-blue-500 hover:underline"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};