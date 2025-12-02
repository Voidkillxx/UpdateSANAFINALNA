import React, { useContext, useState, useEffect } from 'react';
import { Navbar, Container, Nav, Form, FormControl, Badge, Dropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import LogoutConfirmModal from './LogoutConfirmModal';
import '../Styles/Navbar.css'; 
import 'bootstrap-icons/font/bootstrap-icons.css';

const AppNavbar = ({ currentUser, handleLogout, searchTerm, setSearchTerm, handleResetFilters, showAlert }) => {
    const { cartItems } = useContext(CartContext);
    const location = useLocation();
    const isAdminRoute = currentUser?.is_admin && location.pathname.startsWith('/admin');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (expanded) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [expanded]);

    const closeMenu = () => setExpanded(false);
    const handleShowLogoutModal = () => { setShowLogoutModal(true); closeMenu(); };
    const handleCloseLogoutModal = () => setShowLogoutModal(false);
    const handleConfirmLogout = () => { handleLogout(); handleCloseLogoutModal(); };
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartBadgeText = itemCount > 99 ? '99+' : itemCount;

    const handleHomeClick = () => {
        handleResetFilters();
        closeMenu();
    };

    const handleLogoClick = () => {
        handleResetFilters();
        navigate(currentUser?.is_admin ? '/admin' : '/');
        closeMenu();
    };

    return (
        <>
            <Navbar expand="lg" className="navbar-custom" expanded={expanded} onToggle={() => setExpanded(!expanded)} sticky="top">
                <Container fluid>
                    <Navbar.Brand as="div" onClick={handleLogoClick} className="navbar-logo-wrapper" style={{ cursor: 'pointer' }}> 
                        <img src="/img/logo.png" alt="Grocery Store Logo" className="navbar-logo" />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        
                        {isAdminRoute && (
                            <Nav className="me-auto nav-links-custom">
                                <Nav.Link as={Link} to="/admin" onClick={closeMenu}>Dashboard</Nav.Link>
                                <Nav.Link as={Link} to="/admin/orders" onClick={closeMenu}>Manage Orders</Nav.Link>
                                <Nav.Link as={Link} to="/admin/users" onClick={closeMenu}>Manage Users</Nav.Link>
                            </Nav>
                        )}

                        {!isAdminRoute && (
                            <Nav className="me-auto nav-links-custom">
                                <Nav.Link as={Link} to="/" onClick={handleHomeClick}>Home</Nav.Link>
                                <Nav.Link as={Link} to="/products" onClick={closeMenu}>Products</Nav.Link>
                            </Nav>
                        )}

                        {!isAdminRoute && (
                            <Form className="d-flex search-bar-custom" onSubmit={(e) => { e.preventDefault(); closeMenu(); }}>
                                <FormControl type="search" placeholder="Search..." className="me-2" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </Form>
                        )}

                        <Nav className="align-items-center">
                            {currentUser ? (
                                <Dropdown align="end" onSelect={closeMenu} className="ms-2">
                                    <Dropdown.Toggle variant="link" id="dropdown-user" className="nav-link d-flex align-items-center" style={{ boxShadow: 'none', textDecoration: 'none' }}>
                                        <i className="bi bi-person-circle" style={{ fontSize: '1.5rem', color: '#28a745' }}></i>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu style={{ minWidth: '200px', borderRadius: '12px', border: 'none', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
                                        <Dropdown.Header>Hi, {currentUser.first_name}!</Dropdown.Header>
                                        
                                        {/* --- UPDATED: Show Dashboard Link for Admins --- */}
                                        {currentUser.is_admin ? (
                                            <>
                                                <Dropdown.Item as={Link} to="/admin" className="py-2 text-success fw-bold">
                                                    <i className="bi bi-speedometer2 me-2"></i> Dashboard
                                                </Dropdown.Item>
                                                <Dropdown.Divider />
                                            </>
                                        ) : (
                                            <>
                                                <Dropdown.Item as={Link} to="/profile" className="py-2"><i className="bi bi-person-gear me-2"></i> My Profile</Dropdown.Item>
                                                <Dropdown.Item as={Link} to="/orders" className="py-2"><i className="bi bi-bag-check me-2"></i> My Orders</Dropdown.Item>
                                                <Dropdown.Divider />
                                            </>
                                        )}
                                        <Dropdown.Item onClick={handleShowLogoutModal} className="text-danger py-2"><i className="bi bi-box-arrow-right me-2"></i> Logout</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            ) : (
                                <Nav.Link as={Link} to="/login" className="login-button-custom" onClick={closeMenu}>Login</Nav.Link>
                            )}

                            {!isAdminRoute && (
                                <Nav.Link as={Link} to="/cart" className="cart-icon-link ms-2 position-relative" onClick={closeMenu}>
                                    <i className="bi bi-cart" style={{ fontSize: '1.5rem', color: '#28a745' }}></i>
                                    {itemCount > 0 && <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle border border-light rounded-circle">{cartBadgeText}</Badge>}
                                </Nav.Link>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <LogoutConfirmModal show={showLogoutModal} handleClose={handleCloseLogoutModal} handleConfirmLogout={handleConfirmLogout} />
        </>
    );
};
export default AppNavbar;