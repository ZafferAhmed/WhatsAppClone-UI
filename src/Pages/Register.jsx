import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../Services/API";
import toast, { Toaster } from "react-hot-toast";
import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUser,
  FaWhatsapp,
} from "react-icons/fa6";
import { ImSpinner2 } from "react-icons/im";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      navigate("/chat");
    }
  }, [navigate]);

  // Check form validity whenever form data changes
  useEffect(() => {
    const isValid = formData.email && formData.password && formData.name;
    setIsFormValid(!!isValid);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Please fill all the fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser(formData);
      toast.success(response.data.message);
      toast(
        "Hang tight! We're taking you to the chat page in just a few seconds.",
        { duration: 2000 }
      );
      localStorage.setItem("user", JSON.stringify(response.data.user));
      window.dispatchEvent(new Event("storage"));
      setTimeout(() => {
        navigate("/chat");
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press on form
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && isFormValid) {
      handleSubmit(e);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-400 to-green-600 p-4 relative">
        <div
          className="absolute top-6 left-6 cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <FaWhatsapp className="text-6xl text-white" />
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyPress}>
            <div className="mb-4 relative">
              <label className="block text-gray-600 font-medium mb-1">
                Name
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg p-3">
                <FaUser className="text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            <div className="mb-4 relative">
              <label className="block text-gray-600 font-medium mb-1">
                Email
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg p-3">
                <FaEnvelope className="text-gray-500 mr-2" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            <div className="mb-6 relative">
              <label className="block text-gray-600 font-medium mb-1">
                Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg p-3 relative">
                <FaLock className="text-gray-500 mr-2" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full outline-none bg-transparent"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-semibold text-lg transition-all duration-300 flex justify-center items-center ${
                isFormValid
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <ImSpinner2 className="animate-spin text-xl" />
              ) : (
                "Register"
              )}
            </button>
          </form>
        </div>

        <Toaster position="bottom-center" toastOptions={{ duration: 1000 }} />
      </div>
    </>
  );
};

export default Register;
