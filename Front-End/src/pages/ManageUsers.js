import React, { useState, useEffect, useCallback } from 'react';
import { Spinner, Button, Row, Col, Card, Badge, Pagination, Modal } from 'react-bootstrap'; 
import { fetchUsers, updateUserRole, deleteUser } from '../utils/api';
import '../Styles/OrderHistory.css'; 

// --- Confirmation Modal Component ---
const ConfirmModal = ({ show, handleClose, handleConfirm, title, message, variant, isLoading, actionText }) => (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
        <Modal.Header closeButton={!isLoading} className={`bg-${variant} text-white`}>
            <Modal.Title><i className="bi bi-shield-exclamation"></i> {title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p className="fw-bold mb-0">{message}</p>
            {variant === 'danger' && <small className="text-danger mt-2 d-block">This action cannot be undone.</small>}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
            <Button variant={variant === 'warning' ? 'dark' : variant} onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : actionText}
            </Button>
        </Modal.Footer>
    </Modal>
);

const ManageUsers = ({ showAlert }) => { 
    const [users, setUsers] = useState([]); 
    const [filteredUsers, setFilteredUsers] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- MODAL STATE ---
    const [modalConfig, setModalConfig] = useState({
        show: false,
        type: null, // 'role_change' or 'delete'
        user: null,
        title: '',
        message: '',
        variant: 'primary',
        actionText: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20); 

    // Stats
    const [counts, setCounts] = useState({ total: 0, admins: 0 });

    const getUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchUsers(); 
            setUsers(data);
            setFilteredUsers(data);
            setCounts({
                total: data.length,
                admins: data.filter(u => u.is_admin).length
            });
        } catch (err) {
            console.error(err);
            showAlert('Failed to load users', 'danger');
        } finally {
            setIsLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredUsers(users);
        } else {
            const term = searchTerm.toLowerCase();
            setFilteredUsers(users.filter(u => 
                u.first_name.toLowerCase().includes(term) || 
                u.last_name.toLowerCase().includes(term) || 
                u.email.toLowerCase().includes(term)
            ));
        }
        setCurrentPage(1); 
    }, [searchTerm, users]);

    // --- HANDLERS ---

    const openRoleModal = (user) => {
        const isPromoting = !user.is_admin;
        setModalConfig({
            show: true,
            type: 'role_change',
            user: user,
            title: isPromoting ? 'Promote User' : 'Revoke Admin Access',
            message: `Are you sure you want to ${isPromoting ? 'grant Admin rights to' : 'remove Admin rights from'} ${user.first_name} ${user.last_name}?`,
            variant: isPromoting ? 'success' : 'warning',
            actionText: isPromoting ? 'Yes, Promote' : 'Yes, Revoke'
        });
    };

    const openDeleteModal = (user) => {
        setModalConfig({
            show: true,
            type: 'delete',
            user: user,
            title: 'Delete User Account',
            message: `Are you sure you want to permanently delete ${user.first_name} ${user.last_name}?`,
            variant: 'danger',
            actionText: 'Delete User'
        });
    };

    const handleConfirmAction = async () => {
        setIsProcessing(true);
        const { type, user } = modalConfig;

        try {
            if (type === 'role_change') {
                await updateUserRole(user.id, !user.is_admin);
                showAlert(`User role updated successfully!`, 'success');
            } else if (type === 'delete') {
                await deleteUser(user.id);
                showAlert('User deleted successfully.', 'success');
            }
            getUsers(); // Refresh list
        } catch (e) {
            showAlert('Action failed. Please try again.', 'danger');
        } finally {
            setIsProcessing(false);
            setModalConfig({ ...modalConfig, show: false });
        }
    };

    const closeModal = () => {
        if (!isProcessing) setModalConfig({ ...modalConfig, show: false });
    };

    // --- PAGINATION LOGIC ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    };

    if (isLoading) {
        return (
            <div className="order-history-container d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="success" style={{ width: '3rem', height: '3rem' }} />
            </div>
        );
    }

    return (
        <div className="order-history-container" style={{ maxWidth: '1200px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h1 className="mb-0 border-0 p-0">Manage Users</h1>
                <Badge bg="success" style={{ fontSize: '1rem', padding: '10px 15px', borderRadius: '30px' }}>
                    Admin Panel
                </Badge>
            </div>

            {/* --- STATS ROW --- */}
            <Row className="mb-4 g-3">
                <Col md={6}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: '#e3f2fd' }}>
                        <Card.Body className="d-flex align-items-center justify-content-between px-4">
                            <div>
                                <h6 className="text-primary text-uppercase fw-bold mb-1">Total Users</h6>
                                <h3 className="mb-0 fw-bold text-dark">{counts.total}</h3>
                            </div>
                            <i className="bi bi-people-fill fs-1 text-primary opacity-25"></i>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: '#d1e7dd' }}>
                        <Card.Body className="d-flex align-items-center justify-content-between px-4">
                            <div>
                                <h6 className="text-success text-uppercase fw-bold mb-1">Administrators</h6>
                                <h3 className="mb-0 fw-bold text-dark">{counts.admins}</h3>
                            </div>
                            <i className="bi bi-shield-lock-fill fs-1 text-success opacity-25"></i>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <div className="order-search-container">
                <input 
                    type="text" 
                    className="order-search-input" 
                    placeholder="Search users by name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredUsers.length === 0 ? (
                <div className="text-center py-5"><h4 className="text-muted">No users found.</h4></div>
            ) : (
                <>
                    <Row>
                        {currentItems.map(user => (
                            <Col lg={4} md={6} key={user.id} className="mb-4">
                                <div 
                                    className="order-card h-100 d-flex flex-column" 
                                    style={{ 
                                        borderTop: user.is_admin ? '5px solid #28a745' : '1px solid #eaeaea',
                                        backgroundColor: user.is_admin ? '#fafffa' : '#fff'
                                    }}
                                >
                                    <div className="order-header border-bottom-0 pb-0">
                                        <div className="d-flex align-items-center gap-3">
                                            <div 
                                                className={`rounded-circle d-flex justify-content-center align-items-center text-white fw-bold ${user.is_admin ? 'bg-success' : 'bg-secondary'}`}
                                                style={{ width: '45px', height: '45px', fontSize: '1.2rem' }}
                                            >
                                                {user.first_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h2 style={{ textTransform: 'none', fontSize: '1.1rem' }}>{user.first_name} {user.last_name}</h2>
                                                <small className="text-muted">ID: {user.id}</small>
                                            </div>
                                        </div>
                                        {user.is_admin && <Badge bg="success">ADMIN</Badge>}
                                    </div>

                                    <div className="px-4 py-3 flex-grow-1">
                                        <div className="mb-2 text-truncate">
                                            <i className="bi bi-envelope me-2 text-muted"></i>
                                            <span className="text-dark fw-bold">{user.email}</span>
                                        </div>
                                        <div className="mb-2">
                                            <i className="bi bi-telephone me-2 text-muted"></i>
                                            <span>{user.phone_number || 'N/A'}</span>
                                        </div>
                                        <div className="mb-0 small text-muted">
                                            <i className="bi bi-calendar-event me-2"></i>
                                            Joined: {new Date(user.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="order-card-footer bg-light border-top d-flex gap-2">
                                        <Button 
                                            variant={user.is_admin ? "outline-warning" : "outline-success"} 
                                            size="sm"
                                            className="flex-grow-1 rounded-pill fw-bold"
                                            onClick={() => openRoleModal(user)}
                                        >
                                            {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                                        </Button>
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm"
                                            className="rounded-circle"
                                            style={{ width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            onClick={() => openDeleteModal(user)}
                                            title="Delete User"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    {/* --- PAGINATION CONTROLS --- */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                                {totalPages <= 10 ? (
                                    [...Array(totalPages)].map((_, index) => (
                                        <Pagination.Item key={index + 1} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                                            {index + 1}
                                        </Pagination.Item>
                                    ))
                                ) : (
                                    <>
                                        <Pagination.Item active={1 === currentPage} onClick={() => paginate(1)}>1</Pagination.Item>
                                        {currentPage > 3 && <Pagination.Ellipsis />}
                                        {currentPage > 1 && currentPage < totalPages && <Pagination.Item active>{currentPage}</Pagination.Item>}
                                        {currentPage < totalPages - 2 && <Pagination.Ellipsis />}
                                        <Pagination.Item active={totalPages === currentPage} onClick={() => paginate(totalPages)}>{totalPages}</Pagination.Item>
                                    </>
                                )}
                                <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                            </Pagination>
                        </div>
                    )}
                </>
            )}

            {/* --- ACTION CONFIRMATION MODAL --- */}
            <ConfirmModal 
                show={modalConfig.show} 
                handleClose={closeModal} 
                handleConfirm={handleConfirmAction} 
                title={modalConfig.title} 
                message={modalConfig.message} 
                variant={modalConfig.variant} 
                actionText={modalConfig.actionText} 
                isLoading={isProcessing} 
            />
        </div>
    );
};

export default ManageUsers;