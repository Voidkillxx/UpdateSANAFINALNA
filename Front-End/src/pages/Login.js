import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, resendOtp } from "../utils/api";
import OtpPage from "./OtpPage";
import "../Styles/Login.css";

const ErrorModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="modal-backdrop" style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000
    }}>
      <div style={{
        background: "#fff",
        padding: "25px",
        borderRadius: "12px",
        width: "90%",
        maxWidth: "380px",
        textAlign: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
      }}>
        <h4 style={{ color: "#d9534f", marginBottom: "10px" }}>Login Failed</h4>
        <p style={{ fontSize: "14px", marginBottom: "20px" }}>{message}</p>

        <button 
          onClick={onClose}
          style={{
            background: "#d9534f",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "6px",
            cursor: "pointer",
            width: "100%"
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

function Login({ handleLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({ login_id: email, password });

      if (response.require_otp) {
        if (response.email) setEmail(response.email);
        setStep("otp");
      }
    } catch (error) {
      setErrorMessage(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <OtpPage
        email={email}
        context="login"
        onSuccess={(data) => handleLogin(data.token, data.user)}
        onResend={async () => await resendOtp({ email })}
        onBack={() => setStep("login")}
      />
    );
  }

  return (
    <div className="login-container">
      
      <ErrorModal 
        message={errorMessage} 
        onClose={() => setErrorMessage("")}
      />

      <div className="login-card">
        <button className="back-btn" onClick={() => navigate("/")}>← Back</button>

        <div className="logo-container">
          <img src="/img/logo.png" alt="Logo" className="logo" />
        </div>

        <h2 className="store-name">JAKE STORE</h2>
        <h3 className="subtitle">Welcome Back!</h3>
        <p>Login to your account</p>

        <form onSubmit={handleSubmit}>
          <label className="form-label">Email or Username</label>
          <input
            type="text"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <label className="form-label">Password</label>
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Checking..." : "Login"}
          </button>

          <div className="bottom-text">
            <Link to="/forgot">Forgot Password?</Link>
            <br />
            Don’t have an account?{" "}
            <Link to="/register">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;