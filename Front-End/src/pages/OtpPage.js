import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { verifyOtp } from '../utils/api';

// --- REUSABLE MODALS (Internal) ---

const LoadingModal = () => (
  <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center" style={{zIndex: 2000}}>
    <div className="bg-white p-4 rounded shadow text-center">
      <Spinner animation="border" variant="primary" className="mb-3" style={{width: '3rem', height: '3rem'}} />
      <h5 className="mb-0 text-dark fw-bold">Verifying...</h5>
      <small className="text-muted">Please wait a moment</small>
    </div>
  </div>
);

const StatusModal = ({ type, message, onClose }) => (
  <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center" style={{zIndex: 2050}}>
    <div className={`bg-white p-4 rounded shadow text-center ${type === 'error' ? 'border-danger' : 'border-success'}`} style={{maxWidth: '350px', width: '90%', borderTop: '5px solid'}}>
      <div className="mb-3 display-4">
        <i className={`bi ${type === 'error' ? 'bi-x-circle text-danger' : 'bi-check-circle text-success'}`}></i>
      </div>
      <h5 className="fw-bold mb-3">{type === 'error' ? 'Verification Failed' : 'Success!'}</h5>
      <p className="text-muted mb-4">{message}</p>
      <button className={`btn ${type === 'error' ? 'btn-danger' : 'btn-success'} w-100`} onClick={onClose}>OK</button>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

const OtpPage = ({ email, context, onSuccess, onResend, onBack }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60); // Start countdown immediately

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const closeStatus = () => {
    if (message) {
       // If success message is shown, trigger the parent success callback
       // We pass the stored data (if any) or just signal success
    }
    setMessage('');
    setError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
        setError("Please enter a valid 6-digit code.");
        return;
    }
    
    setLoading(true);
    try {
        // If context is 'reset', we might use a different endpoint in the future,
        // but for Login/Register, we use verifyOtp which logs user in.
        const response = await verifyOtp({ email, code: otp });
        
        // Success!
        onSuccess(response); // Pass full response (token/user) to parent
    } catch (err) {
        setError(err.message || "Invalid code. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleResendClick = async () => {
      if (resendTimer > 0) return;
      setLoading(true);
      try {
          await onResend(); // Call parent's resend function
          setResendTimer(60);
          setMessage("New code sent successfully!");
      } catch (err) {
          setError("Failed to resend code.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{minHeight: '100vh', backgroundColor: '#f0fdf4'}}> {/* Light green background match */}
      
      {loading && <LoadingModal />}
      {error && <StatusModal type="error" message={error} onClose={closeStatus} />}
      {message && <StatusModal type="success" message={message} onClose={closeStatus} />}

      <div className="bg-white p-5 rounded shadow-sm position-relative" style={{maxWidth: '500px', width: '95%'}}>
        
        <button 
            className="btn btn-link text-decoration-none text-muted p-0 position-absolute top-0 start-0 m-4"
            onClick={onBack}
            style={{fontWeight: '600'}}
        >
            <i className="bi bi-arrow-left me-1"></i> Back
        </button>

        <div className="text-center mt-3">
            <h2 className="fw-bold text-success mb-2">Verify</h2>
            <p className="text-muted">
                We've sent a secure code to <br/><strong>{email}</strong>
            </p>
        </div>

        <form onSubmit={handleVerify} className="mt-4">
            <div className="mb-4">
                <input 
                    type="text" 
                    className="form-control form-control-lg text-center fw-bold fs-1 border-success" 
                    maxLength="6" 
                    placeholder="000000" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    required 
                    disabled={loading} 
                    style={{letterSpacing: '12px', height: '80px'}} 
                />
            </div>

            <button type="submit" className="btn btn-success w-100 py-3 fw-bold text-uppercase shadow-sm" disabled={loading}>
                {loading ? "Verifying..." : "Confirm & Login"}
            </button>

            <div className="text-center mt-4">
                <span className="text-muted small">Didn't receive the code? </span><br></br>
                <button 
                    type="button" 
                    className={`btn btn-link p-0 text-decoration-none fw-bold ${resendTimer > 0 ? 'text-muted' : 'text-primary'}`} 
                    onClick={handleResendClick} 
                    disabled={resendTimer > 0 || loading}
                >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Now'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default OtpPage;