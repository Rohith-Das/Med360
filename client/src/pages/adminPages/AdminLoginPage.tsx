import { adminLoginUser } from "../../features/auth/adminAuthThunk";
import { useState } from "react";
import { useAppDispatch,useAppSelector } from "../../app/hooks";
import { useNavigate } from "react-router-dom";

export const AdminLoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAppSelector((state) => state.adminAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await dispatch(adminLoginUser({ email, password })).unwrap();
      if (res.adminAccessToken) {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error("Admin Login Failed", err);
    }
  };

  return (
    <div>
      <h2>Admin Login</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button onClick={handleSubmit} disabled={status === "loading"}>
        {status === "loading" ? "Logging in..." : "Login"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};