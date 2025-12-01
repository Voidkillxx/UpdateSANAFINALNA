import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { checkOtpPublic, resetPassword, forgotPassword } from "../utils/api";
import { Spinner } from "react-bootstrap";
import "../Styles/ResetPassword.css";

// --- MODAL COMPONENTS ---
const LoadingModal = ({ text }) => (
  <div className="modal-overlay">
    <div className="modal-content-box">
      <Spinner animation="border" variant="success" className="mb-3 spinner-size" />
      <h5 className="fw-bold">{text || "Processing..."}</h5>
    </div>
  </div>
);

const StatusModal = ({ type, message, onClose }) => (
  <div className="modal-overlay">
    <div className={`modal-content-box status-box ${type}`}>
      <div className="icon-box">
        <i className={`bi ${type === 'error' ? 'bi-x-circle' : 'bi-check-circle'}`}></i>
      </div>
      <h5 className="fw-bold">{type === 'error' ? 'Error' : 'Success!'}</h5>
      <p className="text-muted">{message}</p>
      <button className={`btn-modal ${type}`} onClick={onClose}>OK</button>
    </div>
  </div>
);

function ResetPassword() {
  const [view, setView] = useState('otp'); // 'otp' | 'password'
  
  const [otp, setOtp] = useState("");
  const [verifiedOtp, setVerifiedOtp] = useState(""); 
  
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  
  const navigate = useNavigate();
  const resetEmail = localStorage.getItem("resetEmail");
  // Track if we just finished successfully to prevent auto-redirect
  const [isSuccess, setIsSuccess] = useState(false); 

  useEffect(() => {
    // Only redirect if email is missing AND we haven't just finished successfully
    if (!resetEmail && !isSuccess) {
      setError("No email found. Please start the process again.");
      setTimeout(() => navigate("/forgot"), 2000);
    }
  }, [resetEmail, navigate, isSuccess]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // --- HANDLERS ---
  const closeStatus = () => {
    // If it was a success message, go to Login
    if (message.includes("successfully")) {
        // CLEANUP HERE instead of earlier
        localStorage.removeItem("resetEmail"); 
        navigate("/login");
    }
    // Clear states
    setMessage('');
    setError('');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Please enter a valid 6-digit code."); return; }

    setLoading(true);
    try {
        await checkOtpPublic({ email: resetEmail, code: otp });
        setVerifiedOtp(otp);
        setView('password');
    } catch (err) {
        setError(err.message || "Invalid verification code.");
    } finally {
        setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPass.length < 8) { setError("Password must be at least 8 characters long."); return; }
    if (newPass !== confirmPass) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await resetPassword({ email: resetEmail, code: verifiedOtp, password: newPass });
      
      // Mark as success so the useEffect doesn't kick us out
      setIsSuccess(true);
      
      // Show success message
      setMessage("Password updated successfully! You can now log in.");
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await forgotPassword({ email: resetEmail });
      setMessage(`New code sent to ${resetEmail}`);
      setResendTimer(60);
    } catch (err) {
      setError("Network error sending code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      {loading && <LoadingModal text={view === 'otp' ? "Verifying..." : "Updating..."} />}
      {error && <StatusModal type="error" message={error} onClose={closeStatus} />}
      {message && <StatusModal type="success" message={message} onClose={closeStatus} />}

      <div className="reset-card">
        {/* Navigation */}
        <div className="back">
            <Link to="/login">← Back to Login</Link>
        </div>
        
        {/* Logo */}
        <div className="logo-container">
            <img src="/img/logo.png" alt="Logo" className="logo" />
        </div>

        <h2 className="store-name">JAKE STORE</h2>
        
        {/* UPDATED TITLE */}
        <h3 className="subtitle">
            {view === 'otp' ? 'Enter Code' : 'Reset Password'}
        </h3>
        
        {/* UPDATED TEXT */}
        <p className="text">
            {view === 'otp' 
              ? <>Code sent to <strong>{resetEmail}</strong></> 
              : "Create a new strong password."
            }
        </p>

        {/* --- OTP FORM --- */}
        {view === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
                <input
                    type="text"
                    className="otp-input"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength="6"
                    disabled={loading}
                    autoFocus
                />
                <button type="submit" className="reset-btn" disabled={loading}>
                    Verify Code
                </button>
                
                <div className="resend-container">
                    <button 
                        type="button" 
                        className="resend-link"
                        onClick={handleResendOtp} 
                        disabled={resendTimer > 0 || loading}
                    >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                    </button>
                </div>
            </form>
        )}

        {/* --- PASSWORD FORM --- */}
        {view === 'password' && (
            <form onSubmit={handleReset}>
                <label className="form-label">New Password</label>
                <div className="password-container">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={newPass} 
                        onChange={(e) => setNewPass(e.target.value)} 
                        disabled={loading} 
                    />
                    <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                <label className="form-label">Confirm Password</label>
                <div className="password-container">
                    <input 
                        type={showConfirm ? "text" : "password"} 
                        value={confirmPass} 
                        onChange={(e) => setConfirmPass(e.target.value)} 
                        disabled={loading} 
                    />
                    <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                         {showConfirm ? "Hide" : "Show"}
                    </button>
                </div>

                <button type="submit" className="reset-btn" disabled={loading}>
                    Update Password
                </button>
            </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;