import React, { useState, useEffect, useCallback } from 'react';
import { Spinner, Form, Row, Col, Card, Badge, Nav, Pagination, Button, Modal } from 'react-bootstrap'; 
import { fetchOrders, updateOrderStatus } from '../utils/api';
import '../Styles/OrderHistory.css'; 

const formatToPesos = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

// Status Colors Mapping
const STATUS_COLORS = {
    'All': 'secondary',
    'Pending': 'warning',
    'Processing': 'info',
    'Shipped': 'primary',
    'Delivered': 'success',
    'Cancelled': 'danger',
    'Return Requested': 'danger'
};

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return Requested'];
const TERMINAL_STATES = ['Delivered', 'Cancelled'];

// --- Admin Order Details Modal ---
const AdminOrderDetailsModal = ({ show, handleClose, order }) => {
    if (!order) return null;
    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton className="bg-light">
                <Modal.Title className="fw-bold text-success">Order #{order.id} Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="mb-4">
                    <Col md={6}>
                        <h6 className="fw-bold text-muted text-uppercase small">Customer Info</h6>
                        <p className="mb-1"><strong>Name:</strong> {order.user ? `${order.user.first_name} ${order.user.last_name}` : 'N/A'}</p>
                        <p className="mb-1"><strong>Email:</strong> {order.user?.email || 'N/A'}</p>
                        <p className="mb-0"><strong>Phone:</strong> {order.user?.phone_number || 'N/A'}</p>
                    </Col>
                    <Col md={6}>
                        <h6 className="fw-bold text-muted text-uppercase small">Order Info</h6>
                        <p className="mb-1"><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                        <p className="mb-1"><strong>Payment:</strong> {order.payment_type}</p>
                        <p className="mb-0"><strong>Shipping:</strong> {order.shipping_address}</p>
                    </Col>
                </Row>

                <h6 className="fw-bold text-muted text-uppercase small mb-2 border-bottom pb-2">Order Items</h6>
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Product</th>
                                <th className="text-center">Qty</th>
                                <th className="text-end">Price</th>
                                <th className="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.order_items.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="fw-bold text-dark">{item.product?.product_name || 'Unknown Item'}</div>
                                        <small className="text-muted">ID: {item.product_id}</small>
                                    </td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-end">{formatToPesos(item.price_at_purchase)}</td>
                                    <td className="text-end fw-bold">{formatToPesos(item.price_at_purchase * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="table-light">
                            <tr>
                                <td colSpan="3" className="text-end fw-bold">Shipping Fee:</td>
                                <td className="text-end">{formatToPesos(order.shipping_fee)}</td>
                            </tr>
                            <tr>
                                <td colSpan="3" className="text-end fw-bold text-success fs-5">Grand Total:</td>
                                <td className="text-end fw-bold text-success fs-5">{formatToPesos(order.total_amount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close Details</Button>
            </Modal.Footer>
        </Modal>
    );
};

const ManageOrders = ({ showAlert }) => { 
    const [allOrders, setAllOrders] = useState([]); 
    const [filteredOrders, setFilteredOrders] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters & Pagination
    const [activeFilter, setActiveFilter] = useState('All'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50); 

    // Details Modal
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // KPI Stats
    const [stats, setStats] = useState({ totalRevenue: 0, pendingCount: 0, returnRequestCount: 0 });

    const getOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchOrders(); 
            const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setAllOrders(sortedData);
            
            const revenue = sortedData
                .filter(o => o.status === 'Delivered' || o.status === 'Completed') 
                .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
            
            const pending = sortedData.filter(o => o.status === 'Pending').length;
            const returns = sortedData.filter(o => o.status === 'Return Requested').length;
            
            setStats({ totalRevenue: revenue, pendingCount: pending, returnRequestCount: returns });
        } catch (err) {
            showAlert('Failed to fetch orders.', 'danger');
        } finally {
            setIsLoading(false);
        }
    }, [showAlert]);

    useEffect(() => { getOrders(); }, [getOrders]);

    useEffect(() => {
        let result = allOrders;
        if (activeFilter !== 'All') {
            result = result.filter(order => order.status.toLowerCase() === activeFilter.toLowerCase());
        }
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            result = result.filter(order => 
                order.id.toString().includes(term) ||
                order.user?.first_name?.toLowerCase().includes(term) ||
                order.user?.last_name?.toLowerCase().includes(term) ||
                order.order_items.some(item => item.product?.product_name.toLowerCase().includes(term))
            );
        }
        setFilteredOrders(result);
        setCurrentPage(1); 
    }, [allOrders, activeFilter, searchTerm]);

    const handleStatusChange = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
            if (newStatus === 'Cancelled') showAlert(`Order #${orderId} cancellation APPROVED.`, 'success');
            else if (newStatus === 'Shipped') showAlert(`Order #${orderId} cancellation REJECTED. Status reverted to Shipped.`, 'info');
            else showAlert(`Order #${orderId} updated to ${newStatus}`, 'success');
            getOrders(); 
        } catch (error) {
            showAlert('Failed to update status', 'danger');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setShowDetails(true);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Helper for badge colors (consistent with STATUS_COLORS)
    const getBadgeColor = (status) => {
        return STATUS_COLORS[status] || 'secondary';
    };

    if (isLoading) return <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>;

    return (
        <div className="order-history-container" style={{ maxWidth: '1200px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h1 className="mb-0 border-0 p-0" style={{color: '#1b5e20'}}>Manage Orders</h1>
            </div>

            {/* KPI Row */}
            <Row className="mb-4 g-3">
                <Col md={4}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: '#e8f5e9' }}>
                        <Card.Body className="text-center">
                            <h6 className="text-success text-uppercase fw-bold mb-1">Realized Revenue</h6>
                            <h3 className="mb-0 fw-bold text-dark">{formatToPesos(stats.totalRevenue)}</h3>
                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>(Delivered Only)</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: stats.returnRequestCount > 0 ? '#ffebee' : '#fff3cd' }}>
                        <Card.Body className="text-center">
                            <h6 className={stats.returnRequestCount > 0 ? "text-danger text-uppercase fw-bold mb-1" : "text-warning text-uppercase fw-bold mb-1"}>
                                {stats.returnRequestCount > 0 ? 'Cancellation Requests' : 'Pending Action'}
                            </h6>
                            <h3 className="mb-0 fw-bold text-dark">{stats.returnRequestCount > 0 ? stats.returnRequestCount : stats.pendingCount}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm bg-light">
                        <Card.Body className="text-center">
                            <h6 className="text-muted text-uppercase fw-bold mb-1">Total Orders</h6>
                            <h3 className="mb-0 fw-bold text-dark">{allOrders.length}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <div className="order-search-container mb-4">
                <input type="text" className="order-search-input" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* COLORED FILTERS */}
            <Nav variant="pills" defaultActiveKey="All" className="order-status-tabs mb-4 gap-2 flex-nowrap overflow-auto pb-2">
                {['All', ...STATUS_OPTIONS].map((status) => {
                    const color = STATUS_COLORS[status];
                    const isActive = activeFilter === status;
                    return (
                        <Nav.Item key={status}>
                            <Nav.Link 
                                eventKey={status} 
                                active={isActive}
                                onClick={() => setActiveFilter(status)}
                                className={`rounded-pill px-3 py-1 small fw-bold border border-${color}`}
                                style={{
                                    whiteSpace: 'nowrap',
                                    backgroundColor: isActive ? `var(--bs-${color})` : 'white',
                                    color: isActive ? 'white' : `var(--bs-${color})`,
                                }}
                            >
                                {status} <span className="ms-1 opacity-75">({allOrders.filter(o => status === 'All' ? true : o.status === status).length})</span>
                            </Nav.Link>
                        </Nav.Item>
                    )
                })}
            </Nav>

            {filteredOrders.length === 0 ? (
                <div className="text-center py-5"><h4 className="text-muted">No orders found.</h4></div>
            ) : (
                <>
                    <Row>
                        {currentItems.map(order => {
                            const isTerminal = TERMINAL_STATES.includes(order.status);
                            const isRequest = order.status === 'Return Requested';
                            const statusColor = getBadgeColor(order.status);

                            return (
                                <Col lg={6} key={order.id} className="mb-4">
                                    <div className={`order-card h-100 ${isTerminal ? 'opacity-75' : ''}`} style={{ borderLeft: `5px solid var(--bs-${statusColor})` }}>
                                        {/* COMPACT HEADER */}
                                        <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light rounded-top">
                                            <div>
                                                <h5 className="mb-0 fw-bold">#{order.id}</h5>
                                                <small className="text-muted"><i className="bi bi-person-fill"></i> {order.user ? `${order.user.first_name} ${order.user.last_name}` : 'Guest'}</small>
                                            </div>
                                            <Badge bg={statusColor} className="text-uppercase px-3 py-2">{order.status}</Badge>
                                        </div>

                                        {/* COMPACT BODY */}
                                        <div className="p-3">
                                            {isRequest && (
                                                <div className="alert alert-danger py-1 mb-2 small text-center fw-bold">
                                                    Action Required: Request Pending
                                                </div>
                                            )}
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">Total: <strong className="text-dark">{formatToPesos(order.total_amount)}</strong></span>
                                                <span className="text-muted small">{new Date(order.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="mt-2 text-center">
                                                <Button 
                                                    variant="link" 
                                                    size="sm" 
                                                    className="text-decoration-none fw-bold text-success" 
                                                    onClick={() => handleViewDetails(order)}
                                                >
                                                    See Details <i className="bi bi-arrow-right-circle ms-1"></i>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* ACTION FOOTER */}
                                        <div className="order-card-footer mt-auto p-3 border-top bg-white d-flex justify-content-between align-items-center">
                                            {isRequest ? (
                                                <div className="d-flex gap-2 w-100 justify-content-center">
                                                    <Button variant="outline-secondary" size="sm" onClick={() => handleStatusChange(order.id, 'Shipped')} disabled={updatingOrderId === order.id}>Reject</Button>
                                                    <Button variant="danger" size="sm" onClick={() => handleStatusChange(order.id, 'Cancelled')} disabled={updatingOrderId === order.id}>
                                                        {updatingOrderId === order.id ? <Spinner size="sm" animation="border"/> : 'Approve Cancel'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="d-flex gap-2 align-items-center w-100">
                                                    <span className="small text-muted fw-bold">Status:</span>
                                                    <Form.Select 
                                                        size="sm" 
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        disabled={updatingOrderId === order.id || isTerminal}
                                                        className="shadow-none border-success"
                                                        style={{fontWeight: '600'}}
                                                    >
                                                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </Form.Select>
                                                    {updatingOrderId === order.id && <Spinner size="sm" animation="border" variant="success"/>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                                {[...Array(totalPages)].map((_, index) => (
                                    <Pagination.Item key={index + 1} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>{index + 1}</Pagination.Item>
                                ))}
                                <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                            </Pagination>
                        </div>
                    )}
                </>
            )}
            
            <AdminOrderDetailsModal show={showDetails} handleClose={() => setShowDetails(false)} order={selectedOrder} />
        </div>
    );
};

export default ManageOrders;