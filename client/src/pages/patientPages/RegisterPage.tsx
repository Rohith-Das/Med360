import { useState } from "react";
import { useDispatch } from "react-redux";
import { registerUser } from "../../features/auth/authThunks";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaMobileAlt, FaLock, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../../components/patient/Navbar";

export const RegisterPage = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    mobile: "", 
    password: "" 
  });
  
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    mobile: "",
    password: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: "",
      email: "",
      mobile: "",
      password: ""
    };

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (form.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
      isValid = false;
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Mobile validation
    if (!form.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(form.mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit number";
      isValid = false;
    }

    // Password validation
    if (!form.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await dispatch(registerUser(form)).unwrap();
      toast.success("Registration successful! Redirecting to OTP verification...", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
      }, 2000);
    } catch (err) {
      console.error("Registration failed", err);
      toast.error("Registration failed. Please try again.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
   
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      <ToastContainer />
      
      <div className="flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 py-4 px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center">Patient Registration</h2>
            <p className="text-blue-100 text-center mt-1 text-sm sm:text-base">
              Create your account to access medical services
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Name Field */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400 text-sm sm:text-base" />
                  </div>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className={`block w-full pl-10 pr-3 py-2 sm:py-3 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              {/* Email Field */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400 text-sm sm:text-base" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className={`block w-full pl-10 pr-3 py-2 sm:py-3 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              {/* Mobile Field */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMobileAlt className="text-gray-400 text-sm sm:text-base" />
                  </div>
                  <input
                    name="mobile"
                    type="tel"
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="Mobile Number"
                    className={`block w-full pl-10 pr-3 py-2 sm:py-3 border ${errors.mobile ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                  />
                </div>
                {errors.mobile && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>
                )}
              </div>
              
              {/* Password Field */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400 text-sm sm:text-base" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={`block w-full pl-10 pr-10 py-2 sm:py-3 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="text-sm sm:text-base" />
                    ) : (
                      <FaEye className="text-sm sm:text-base" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>
            
            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Register <FaArrowRight className="ml-1 sm:ml-2" />
                  </span>
                )}
              </button>
            </div>
          </form>
          
          {/* Footer */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-center text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};