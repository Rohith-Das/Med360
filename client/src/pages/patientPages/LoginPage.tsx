import { useDispatch } from "react-redux";
import { useState } from "react";
import { loginUser } from "../../features/auth/authThunks";
import { useNavigate } from "react-router-dom";

export const LoginPage = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      navigate('/dashboard'); 
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div>
      <input onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button onClick={handleSubmit}>Login</button>
    </div>
  );
};
