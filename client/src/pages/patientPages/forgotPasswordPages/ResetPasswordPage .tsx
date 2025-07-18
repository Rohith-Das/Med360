
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetPasswordWithOtp } from "../../../features/auth/authThunks";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const emailFromParams = searchParams.get("email") || "";
  
  const [email, setEmail] = useState(emailFromParams);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  const validatePasswords = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePasswords()) return;

    setLoading(true);
    try {
      await dispatch(resetPasswordWithOtp({ email, otp, newPassword })).unwrap();
      toast.success("Password reset successfully! Please login with your new password.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
      
      <div className="mb-4">
        <label className="block mb-2">Email</label>
        <input
          type="email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">OTP</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">New Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Confirm New Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (newPassword !== e.target.value) {
              setPasswordError("Passwords do not match");
            } else {
              setPasswordError("");
            }
          }}
          required
        />
        {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
      </div>

      <button
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        onClick={handleSubmit}
        disabled={loading || !email || !otp || !newPassword || !confirmPassword || !!passwordError}
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </div>
  );
};