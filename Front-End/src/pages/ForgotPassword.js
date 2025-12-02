import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../utils/api";
import "../Styles/ForgotPassword.css";

// Added showNotification prop
function ForgotPassword({ showNotification }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (resendTimer > 0) timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { 
        showNotification("Please enter your email.", "error"); 
        return; 
    }
    setLoading(true);

    try {
      await forgotPassword({ email });
      // --- REPLACED ALERT WITH NOTIFICATION MODAL ---
      showNotification("Email found! OTP sent to your email.", "success");
      setResendTimer(60);
      localStorage.setItem("resetEmail", email); 
      navigate("/reset"); 
    } catch (error) {
      // --- REPLACED ALERT WITH NOTIFICATION MODAL (covers User not found) ---
      showNotification(error.message || "User not found", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <div className="back"><Link to="/login">← Back to Login</Link></div>
        <div className="logo-container"><img src="/img/logo.png" alt="Logo" className="logo" /></div>   
        <h2 className="store-name">JAKE STORE</h2>
        <h3 className="subtitle">Forgot Password</h3>
        <p className="text">Enter your email to reset your password</p>
        <form onSubmit={handleSubmit}>
          <label className="form-label">Email Address</label>
          <input type="email" placeholder="Enter your registered email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          <button type="submit" className="reset-btn" disabled={loading}>{loading ? "Sending..." : "Continue"}</button>
        </form>
        {resendTimer > 0 && <p style={{textAlign: 'center', marginTop: '10px', color: '#666'}}>Resend available in {resendTimer}s</p>}
      </div>
    </div>
  );
}
export default ForgotPassword;