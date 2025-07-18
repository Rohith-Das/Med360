import { useDispatch } from "react-redux";
import { useState } from "react";
import { loginUser } from "../../features/auth/authThunks";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/patient/Navbar";
export const LoginPage = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      navigate('/home'); 
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div>
      <Navbar/>
      <input onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button onClick={handleSubmit}>Login</button>
       <div className="text-center">
        <button 
          className="text-blue-500 hover:underline"
          onClick={() => navigate("/request-password-reset-otp")}
        >
          Forgot Password?
        </button>
      </div>
    </div>
  );
};
