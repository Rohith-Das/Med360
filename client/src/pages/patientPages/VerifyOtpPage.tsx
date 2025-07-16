import { useState,useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useSearchParams } from "react-router-dom";

export const VerifyOtpPage = () => {
  const [searchParams] = useSearchParams();
  const emailFromParams = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromParams);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await axiosInstance.post("/patient/verify-otp", { email, otp });
      setMessage(res.data.message);
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await axiosInstance.post("/patient/resend-otp", { email });
      setMessage(res.data.message);
      setResendCooldown(60); // Cooldown in seconds
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Verify Your OTP</h2>
      <input
        type="email"
        placeholder="Enter Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
      <br />
      <button onClick={handleResendOtp} disabled={resendCooldown > 0 || loading}>
        {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};