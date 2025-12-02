import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Tab, Tabs, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import '../Styles/ProfilePage.css';

const ProfilePage = ({ showAlert }) => {
    const navigate = useNavigate();
    
    // User Data State
    const [user, setUser] = useState({
        first_name: '', last_name: '', email: '', phone_number: '', address: '', zipcode: ''
    });

    // Loading States
    const [loading, setLoading] = useState(false);
    const [fetchingProfile, setFetchingProfile] = useState(true);
    
    // Security States
    const [passwords, setPasswords] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
    
    // Email Change States
    const [newEmail, setNewEmail] = useState('');
    const [emailChangePassword, setEmailChangePassword] = useState(''); 

    // --- SHOW/HIDE PASSWORD STATES ---
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [showEmailVerifyPass, setShowEmailVerifyPass] = useState(false);

    // --- SEPARATE OTP STATES ---
    const [showPasswordOtpInput, setShowPasswordOtpInput] = useState(false);
    const [passwordOtpLoading, setPasswordOtpLoading] = useState(false); 
    const [passwordOtp, setPasswordOtp] = useState('');

    const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
    const [emailOtpLoading, setEmailOtpLoading] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');
    
    const [activeTab, setActiveTab] = useState('info');

    // --- FETCH PROFILE LOGIC ---
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }

            setFetchingProfile(true);

            try {
                const res = await fetch('http://localhost:8095/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setUser(data);
                } else {
                    showAlert('Failed to load profile', 'danger');
                }
            } catch (error) {
                console.error(error);
                showAlert('Server error while loading profile.', 'danger');
            } finally {
                setFetchingProfile(false);
            }
        };

        fetchProfile();
    }, [navigate, showAlert]); 

    const handleInfoUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:8095/api/user/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    first_name: user.first_name,
                    last_name: user.last_name,
                    phone_number: user.phone_number,
                    address: user.address,
                    zipcode: user.zipcode
                })
            });
            
            if (res.ok) {
                showAlert('Profile information updated successfully!', 'success');
            } else {
                showAlert('Failed to update profile.', 'danger');
            }
        } catch (error) {
            showAlert('Server error.', 'danger');
        }
        setLoading(false);
    };

    // --- REQUEST OTP LOGIC ---
    const requestOtp = async (actionType) => {
        const token = localStorage.getItem('token');

        // Validation for Email Change
        if (actionType === 'email') {
            if (!newEmail) {
                showAlert('Please enter the new email address first.', 'warning');
                return;
            }
            if (!emailChangePassword) {
                showAlert('Please enter your current password to verification.', 'warning');
                return;
            }
        }

        // Validation for Password Change (Length Check)
        if (actionType === 'password') {
            if (passwords.new_password.length < 8) {
                showAlert("Password must be at least 8 characters long.", "warning");
                return;
            }
            if (passwords.new_password !== passwords.new_password_confirmation) {
                showAlert("New passwords do not match!", "warning");
                return;
            }
        }

        if (actionType === 'password') setPasswordOtpLoading(true);
        if (actionType === 'email') setEmailOtpLoading(true);
        
        if (actionType === 'password') setShowEmailOtpInput(false);
        if (actionType === 'email') setShowPasswordOtpInput(false);

        // --- PAYLOAD CREATION ---
        const payload = {};
        if (actionType === 'email') {
            payload.email = newEmail; 
            payload.current_password = emailChangePassword; 
        }

        try {
            const res = await fetch('http://localhost:8095/api/user/request-otp', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                if (actionType === 'email') {
                    showAlert(`OTP Code sent to ${newEmail}!`, 'success');
                } else {
                    showAlert('OTP Code sent to your email!', 'success');
                }
                
                if (actionType === 'password') setShowPasswordOtpInput(true);
                if (actionType === 'email') setShowEmailOtpInput(true);
            } else {
                const data = await res.json();
                showAlert(data.message || 'Failed to send OTP.', 'danger');
            }
        } catch (error) {
            showAlert('Error sending OTP.', 'danger');
        }

        if (actionType === 'password') setPasswordOtpLoading(false);
        if (actionType === 'email') setEmailOtpLoading(false);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwords.new_password.length < 8) {
            showAlert("Password must be at least 8 characters long.", "warning");
            return;
        }

        if(passwords.new_password !== passwords.new_password_confirmation) {
            showAlert("New passwords do not match!", "warning");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:8095/api/user/password', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: passwords.current_password,
                    new_password: passwords.new_password,
                    new_password_confirmation: passwords.new_password_confirmation,
                    otp: passwordOtp
                })
            });
            const data = await res.json();
            if (res.ok) {
                showAlert(data.message, 'success');
                setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' });
                setPasswordOtp(''); 
                setShowPasswordOtpInput(false);
            } else {
                showAlert(data.message, 'danger');
            }
        } catch (error) {
            showAlert('Error updating password.', 'danger');
        }
        setLoading(false);
    };

    const handleEmailChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:8095/api/user/email', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: newEmail, otp: emailOtp })
            });
            const data = await res.json();
            if (res.ok) {
                showAlert(data.message, 'success');
                setUser({ ...user, email: newEmail });
                setNewEmail('');
                setEmailChangePassword(''); 
                setEmailOtp(''); 
                setShowEmailOtpInput(false);
            } else {
                showAlert(data.message, 'danger');
            }
        } catch (error) {
            showAlert('Error updating email.', 'danger');
        }
        setLoading(false);
    };

    if (fetchingProfile) {
        return (
            <Container className="profile-container d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="success" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-3 text-muted">Loading your profile...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container className="profile-container">
            <Card className="profile-card">
                <Card.Header className="profile-header">
                    <h3 className="profile-title text-success">My Profile</h3>
                </Card.Header>
                <Card.Body>
                    <Tabs 
                        activeKey={activeTab} 
                        onSelect={(k) => { 
                            setActiveTab(k); 
                            setShowPasswordOtpInput(false); 
                            setShowEmailOtpInput(false); 
                            setPasswordOtp(''); 
                            setEmailOtp(''); 
                            setEmailChangePassword('');
                            setShowCurrentPass(false);
                            setShowNewPass(false);
                            setShowConfirmPass(false);
                            setShowEmailVerifyPass(false);
                        }} 
                        className="mb-4"
                    >
                        <Tab eventKey="info" title="Personal Info">
                            <Form onSubmit={handleInfoUpdate}>
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>First Name</Form.Label>
                                            <Form.Control type="text" value={user.first_name} onChange={e => setUser({...user, first_name: e.target.value})} required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Last Name</Form.Label>
                                            <Form.Control type="text" value={user.last_name} onChange={e => setUser({...user, last_name: e.target.value})} required />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Phone Number</Form.Label>
                                            <Form.Control type="text" value={user.phone_number} onChange={e => setUser({...user, phone_number: e.target.value})} required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Zipcode</Form.Label>
                                            <Form.Control type="text" value={user.zipcode} onChange={e => setUser({...user, zipcode: e.target.value})} required />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-4">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control as="textarea" rows={2} value={user.address} onChange={e => setUser({...user, address: e.target.value})} required />
                                </Form.Group>
                                <Button variant="success" type="submit" disabled={loading}>
                                    {loading ? <Spinner animation="border" size="sm" /> : 'Update Info'}
                                </Button>
                            </Form>
                        </Tab>

                        <Tab eventKey="security" title="Security Settings">
                            <Alert variant="info"><i className="bi bi-shield-lock"></i> Changes here require email verification (OTP).</Alert>
                            
                            <div className="security-section">
                                <h5>Change Password</h5>
                                <Form onSubmit={handlePasswordChange} autoComplete="off">
                                    <Row className="mb-3">
                                        <Col md={4}>
                                            <InputGroup>
                                                <Form.Control 
                                                    id="cp_current"
                                                    name="cp_current_password"
                                                    autoComplete="current-password"
                                                    type={showCurrentPass ? "text" : "password"} 
                                                    placeholder="Current Password" 
                                                    value={passwords.current_password} 
                                                    onChange={e => setPasswords({...passwords, current_password: e.target.value})} 
                                                    required 
                                                />
                                                <Button variant="outline-secondary" onClick={() => setShowCurrentPass(!showCurrentPass)}>
                                                    <i className={showCurrentPass ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                                                </Button>
                                            </InputGroup>
                                        </Col>
                                        <Col md={4}>
                                            <InputGroup>
                                                <Form.Control 
                                                    id="cp_new"
                                                    name="cp_new_password"
                                                    autoComplete="new-password"
                                                    type={showNewPass ? "text" : "password"} 
                                                    placeholder="New Password" 
                                                    value={passwords.new_password} 
                                                    onChange={e => setPasswords({...passwords, new_password: e.target.value})} 
                                                    required 
                                                />
                                                <Button variant="outline-secondary" onClick={() => setShowNewPass(!showNewPass)}>
                                                    <i className={showNewPass ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                                                </Button>
                                            </InputGroup>
                                        </Col>
                                        <Col md={4}>
                                            <InputGroup>
                                                <Form.Control 
                                                    id="cp_confirm"
                                                    name="cp_confirm_password"
                                                    autoComplete="new-password"
                                                    type={showConfirmPass ? "text" : "password"} 
                                                    placeholder="Confirm Password" 
                                                    value={passwords.new_password_confirmation} 
                                                    onChange={e => setPasswords({...passwords, new_password_confirmation: e.target.value})} 
                                                    required 
                                                />
                                                <Button variant="outline-secondary" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                                                    <i className={showConfirmPass ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                                                </Button>
                                            </InputGroup>
                                        </Col>
                                    </Row>
                                    
                                    {!showPasswordOtpInput ? (
                                        <Button variant="success" onClick={() => requestOtp('password')} disabled={passwordOtpLoading}>
                                            {passwordOtpLoading ? <span className="fw-bold">Sending OTP...</span> : 'Request OTP to Change Password'}
                                        </Button>
                                    ) : (
                                        <div className="d-flex align-items-center gap-10">
                                            <Form.Control className="input-otp" type="text" placeholder="OTP" value={passwordOtp} onChange={e => setPasswordOtp(e.target.value)} required />
                                            <Button variant="success" type="submit" disabled={loading}>Confirm Password Change</Button>
                                        </div>
                                    )}
                                </Form>
                            </div>

                            <div className="security-section">
                                <h5>Change Email Address</h5>
                                <p className="text-muted small">Current: {user.email}</p>
                                <Form onSubmit={handleEmailChange} autoComplete="off">
                                    <Form.Group className="mb-3 input-email-change">
                                        <Form.Control 
                                            name="new_email_address"
                                            autoComplete="email"
                                            type="email" 
                                            placeholder="Enter new email address" 
                                            value={newEmail} 
                                            onChange={e => setNewEmail(e.target.value)} 
                                            required 
                                        />
                                    </Form.Group>

                                    {!showEmailOtpInput && (
                                        <Form.Group className="mb-3 input-email-change">
                                            <InputGroup>
                                                <Form.Control 
                                                    id="ce_password"
                                                    name="ce_verify_password"
                                                    // "new-password" prevents browsers from autofilling with the saved site password
                                                    autoComplete="new-password"
                                                    type={showEmailVerifyPass ? "text" : "password"} 
                                                    placeholder="Enter current password to verify" 
                                                    value={emailChangePassword} 
                                                    onChange={e => setEmailChangePassword(e.target.value)} 
                                                />
                                                <Button variant="outline-secondary" onClick={() => setShowEmailVerifyPass(!showEmailVerifyPass)}>
                                                    <i className={showEmailVerifyPass ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                                                </Button>
                                            </InputGroup>
                                        </Form.Group>
                                    )}

                                    {!showEmailOtpInput ? (
                                        <Button variant="success" onClick={() => requestOtp('email')} disabled={emailOtpLoading || !newEmail || !emailChangePassword}>
                                            {emailOtpLoading ? <span className="fw-bold">Sending OTP...</span> : 'Request OTP to Change Email'}
                                        </Button>
                                    ) : (
                                        <div className="d-flex align-items-center gap-10">
                                            <Form.Control className="input-otp" type="text" placeholder="OTP" value={emailOtp} onChange={e => setEmailOtp(e.target.value)} required />
                                            <Button variant="success" type="submit" disabled={loading}>Confirm Email Change</Button>
                                        </div>
                                    )}
                                </Form>
                            </div>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ProfilePage;