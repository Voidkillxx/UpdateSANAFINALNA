import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, resendOtp } from "../utils/api";
import { Spinner, Row, Col } from "react-bootstrap";
import OtpPage from "./OtpPage";
import "../Styles/Register.css";
 
const logo = "https://placehold.co/100x100/41a85f/ffffff?text=JS"; 

const LoadingModal = () => (
  <div className="loading-overlay">
    <div className="loading-content">
      <Spinner animation="border" variant="success" className="mb-3 spinner-size" />
      <h5 className="mb-0 text-dark fw-bold">Creating Account...</h5>
    </div>
  </div>
);

function Register({ onLogin }) {
  const [view, setView] = useState('register');
  const [loading, setLoading] = useState(false); // Added missing state
  const navigate = useNavigate(); // Added missing hook

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone_number: "",
    zipcode: "",
    address: "",
    password: "",
    password_confirmation: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const [dialogOpen, setDialogOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [dialogMsg, setDialogMsg] = useState("");

  const openDialog = (msg) => {
    setDialogMsg(msg);
    setDialogOpen(true);
    // You might want to actually show a modal/alert here using these states
    alert(msg); 
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirmation) {
      openDialog("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await registerUser(formData);
      setView('otp');
    } catch (err) {
      openDialog(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (view === 'otp') {
      return (
          <OtpPage 
             email={formData.email}
             context="register"
             onSuccess={(data) => {
                 if(onLogin) onLogin(data.token, data.user);
                 else navigate('/login');
             }}
             onResend={async () => await resendOtp({ email: formData.email })}
             onBack={() => setView('register')}
          />
      );
  }

  return (
    <div className="register-container">
      {loading && <LoadingModal />}
      
      <div className="register-card">
        <button className="back-btn" onClick={() => navigate("/login")}>
          ← Back to Login
        </button>

        <div className="logo-container" style={{textAlign: 'center', marginBottom: '1rem'}}>
           <img src={logo} alt="Jake Store Logo" className="logo" style={{width: '80px'}}/>
        </div>
        <h2 className="store-name">JAKE STORE</h2>
        <p className="subtitle">Create Account</p>

        <form onSubmit={handleRegister}>
          <Row className="g-3">
            <Col md={6}>
                <label className="form-label">First Name</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required disabled={loading} placeholder="e.g. John" />
            </Col>
            <Col md={6}>
                <label className="form-label">Last Name</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required disabled={loading} placeholder="e.g. Doe" />
            </Col>
            
            <Col md={6}>
                <label className="form-label">Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} required disabled={loading} placeholder="Choose a username" />
            </Col>
            <Col md={6}>
                <label className="form-label">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={loading} placeholder="name@example.com" />
            </Col>
            
            <Col md={6}>
                <label className="form-label">Phone Number</label>
                <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} required disabled={loading} placeholder="+1 234 567 8900" />
            </Col>
            <Col md={6}>
                <label className="form-label">Zipcode</label>
                <input type="text" name="zipcode" value={formData.zipcode} onChange={handleChange} required disabled={loading} placeholder="12345" />
            </Col>
            
            <Col xs={12}>
                <label className="form-label">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} required disabled={loading} placeholder="Street, City, State" />
            </Col>
            
            {/* Password Fields */}
            <Col md={6}>
                <label className="form-label">Password</label>
                <div className="password-wrapper">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                        disabled={loading} 
                        placeholder="••••••••"
                    />
                    <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>
            </Col>
            <Col md={6}>
                <label className="form-label">Confirm Password</label>
                <div className="password-wrapper">
                    <input 
                        type={showConfirm ? "text" : "password"} 
                        name="password_confirmation" 
                        value={formData.password_confirmation} 
                        onChange={handleChange} 
                        required 
                        disabled={loading}
                        placeholder="••••••••" 
                    />
                    <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? "Hide" : "Show"}
                    </button>
                </div>
            </Col>
          </Row>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Processing..." : "Create Account"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Register;