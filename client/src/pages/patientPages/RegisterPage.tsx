import { useState } from "react";
import { useDispatch } from "react-redux";
import { registerUser  } from "../../features/auth/authThunks";
export const RegisterPage = () => {
  const dispatch = useDispatch<any>();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

const handleSubmit = async () => {
  try {
    console.log("Submitting form:", form);  // 👈 Check this in browser console
    await dispatch(registerUser(form)).unwrap();
    window.location.href = `/verify-otp?email=${encodeURIComponent(form.email)}`;
  } catch (err) {
    console.error("Registration failed", err);
  }
};


  return (
    <div>
      <input name="name" placeholder="Name" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="mobile" placeholder="Mobile" onChange={handleChange} />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} />
      <button onClick={handleSubmit}>Register</button>
    </div>
  );
};
