import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Nav, Spinner, Pagination, Badge } from 'react-bootstrap'; 
import { fetchOrders, cancelOrder, receiveOrder, requestCancellation } from '../utils/api';
import '../Styles/OrderHistory.css';

const formatToPesos = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

const STATUS_FILTERS = {
    'All': 'All',
    'Pending': 'To Pay / Pending',
    'Processing': 'To Ship / Processed',
    'Shipped': 'Shipping',
    'Delivered': 'Delivered',
    'Completed': 'Completed',
    'Cancelled': 'Cancelled',
    'Return Requested': 'Return Requested',
};

// --- Component: Action Modal (Confirmation) ---
const ActionModal = ({ show, handleClose, handleConfirm, title, message, variant, isLoading, actionText }) => (
    <Modal show={show} onHide={handleClose} centered backdrop={isLoading ? 'static' : true} keyboard={!isLoading}>
        <Modal.Header closeButton={!isLoading} className={`bg-${variant === 'danger' ? 'warning' : 'success'} text-dark`}>
            <Modal.Title><i className="bi bi-exclamation-circle-fill"></i> {title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p className="fw-bold">{message}</p>
            {variant === 'danger' && <p className="small text-muted">This action cannot be undone.</p>}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Back</Button>
            <Button variant={variant} onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : actionText}
            </Button>
        </Modal.Footer>
    </Modal>
);

// --- Component: Order Details Modal ---
const OrderDetailsModal = ({ show, handleClose, order }) => {
    if (!order) return null;
    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title className="fw-bold text-success">Order Details #{order.id}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex justify-content-between mb-4 bg-light p-3 rounded border">
                    <div>
                        <small className="text-muted d-block text-uppercase" style={{fontSize: '0.75rem'}}>Status</small>
                        <Badge bg={order.status === 'Cancelled' ? 'danger' : 'success'} className="text-uppercase px-3 py-2">{order.status}</Badge>
                    </div>
                    <div>
                        <small className="text-muted d-block text-uppercase" style={{fontSize: '0.75rem'}}>Payment Method</small>
                        <strong className="text-dark">{order.payment_type}</strong>
                    </div>
                    <div>
                        <small className="text-muted d-block text-uppercase" style={{fontSize: '0.75rem'}}>Total Amount</small>
                        <strong className="text-success fs-5">{formatToPesos(order.total_amount)}</strong>
                    </div>
                </div>

                <h6 className="fw-bold border-bottom pb-2 mb-3 text-dark">Shipping Information</h6>
                <p className="text-secondary small mb-4 ms-2"><i className="bi bi-geo-alt-fill me-2 text-success"></i>{order.shipping_address}</p>

                <h6 className="fw-bold border-bottom pb-2 mb-3 text-dark">Items Ordered</h6>
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light small text-uppercase">
                            <tr>
                                <th>Product</th>
                                <th className="text-center">Qty</th>
                                <th className="text-end">Price</th>
                                <th className="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.order_items.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="fw-bold text-dark">{item.product?.product_name || 'Unknown'}</div>
                                    </td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-end text-muted">{formatToPesos(item.price_at_purchase)}</td>
                                    <td className="text-end fw-bold">{formatToPesos(item.price_at_purchase * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

const OrderHistory = ({ showAlert }) => { 
    const [allOrders, setAllOrders] = useState([]); 
    const [filteredOrders, setFilteredOrders] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filters & Pagination
    const [activeFilter, setActiveFilter] = useState('All'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); 
    
    // Hover State for Tabs
    const [hoveredTab, setHoveredTab] = useState(null);

    // Modal States
    const [modalConfig, setModalConfig] = useState({ show: false, type: null, orderId: null, title: '', message: '', variant: 'primary', actionText: '' });
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const getOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchOrders(); 
            const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setAllOrders(sortedData);
        } catch (err) {
            setError('Failed to fetch orders.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { getOrders(); }, [getOrders]);

    useEffect(() => {
        let result = allOrders;
        if (activeFilter !== 'All') {
            result = result.filter(order => order.status.toLowerCase() === activeFilter.toLowerCase());
        }
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            result = result.filter(order => order.order_items.some(item => item.product?.product_name.toLowerCase().includes(term)));
        }
        setFilteredOrders(result);
        setCurrentPage(1);
    }, [allOrders, activeFilter, searchTerm]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginate = (pageNumber) => { setCurrentPage(pageNumber); window.scrollTo(0, 0); };

    // Handlers
    const openActionModal = (type, orderId, e) => {
        e.stopPropagation(); // Prevent row click
        let config = { show: true, type, orderId, variant: 'primary', actionText: 'Confirm' };
        if (type === 'cancel') {
            config.title = 'Cancel Order'; config.message = `Are you sure you want to cancel Order #${orderId}?`; config.variant = 'danger'; config.actionText = 'Yes, Cancel Order';
        } else if (type === 'request_cancel') {
            config.title = 'Request Cancellation'; config.message = `Order #${orderId} is shipped. Request Admin approval?`; config.variant = 'warning'; config.actionText = 'Send Request';
        } else if (type === 'receive') {
            config.title = 'Confirm Delivery'; config.message = `Received Order #${orderId}? It will be marked Completed.`; config.variant = 'success'; config.actionText = 'Yes, Received';
        }
        setModalConfig(config);
    };

    const handleActionConfirm = async () => {
        setIsProcessingAction(true);
        const { type, orderId } = modalConfig;
        try {
            if (type === 'cancel') { await cancelOrder(orderId); showAlert('Order cancelled successfully.', 'success'); }
            else if (type === 'request_cancel') { await requestCancellation(orderId); showAlert('Cancellation request sent.', 'info'); }
            else if (type === 'receive') { await receiveOrder(orderId); showAlert('Order Completed! Thank you.', 'success'); }
            getOrders();
        } catch (err) { showAlert(err.message || 'Action failed.', 'danger'); } 
        finally { setIsProcessingAction(false); setModalConfig({ ...modalConfig, show: false }); }
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
    };

    // Helper for Status Badge Color
    const getStatusColor = (status) => {
        switch(status) {
            case 'Completed': return 'success';
            case 'Delivered': return 'primary';
            case 'Shipped': return 'info';
            case 'Cancelled': return 'danger';
            case 'Pending': return 'warning';
            default: return 'secondary';
        }
    };

    if (isLoading) return <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>;
    if (error) return <div className="order-history-container"><h2 className="error-message">{error}</h2></div>;

    return (
        <div className="order-history-container bg-white p-4 rounded-4 shadow-sm" style={{ maxWidth: '1200px', margin: '40px auto' }}>
            <h2 className="mb-4 fw-bold" style={{ color: '#28a745' }}>My Order History</h2>
            
            <div className="mb-4">
                <input 
                    type="text" 
                    className="form-control bg-light border-0 py-2 px-3 rounded-3" 
                    placeholder="Search orders..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>

            <Nav variant="pills" defaultActiveKey="All" className="order-status-tabs mb-4 gap-2 flex-nowrap overflow-auto pb-2">
                {Object.entries(STATUS_FILTERS).map(([key, label]) => {
                    const isActive = activeFilter === key;
                    const isHovered = hoveredTab === key;
                    return (
                        <Nav.Item key={key} onMouseEnter={() => setHoveredTab(key)} onMouseLeave={() => setHoveredTab(null)}>
                            <Nav.Link 
                                eventKey={key} 
                                active={isActive} 
                                onClick={() => setActiveFilter(key)}
                                className="rounded-pill px-4 py-2 fw-bold shadow-sm border"
                                style={{
                                    whiteSpace: 'nowrap',
                                    // Logic: Active = Green BG/White Text. Hover = White BG/Green Text. Default = Light/Gray.
                                    backgroundColor: isActive ? '#28a745' : (isHovered ? 'white' : '#f8f9fa'),
                                    color: isActive ? 'white' : (isHovered ? '#28a745' : '#6c757d'),
                                    borderColor: isActive || isHovered ? '#28a745' : 'transparent',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {label} <span className="ms-1 opacity-75">({allOrders.filter(o => key === 'All' ? true : o.status.toLowerCase() === key.toLowerCase()).length})</span>
                            </Nav.Link>
                        </Nav.Item>
                    )
                })}
            </Nav>

            <div className="order-list d-flex flex-column gap-3">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-5"><h4 className="text-muted">No orders found.</h4></div>
                ) : (
                    <>
                        {currentItems.map(order => (
                            <div key={order.id} className="border-bottom pb-3 mb-3">
                                {/* Row 1: ID & Status */}
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <h5 className="fw-bold mb-0 text-dark">Order #{order.id}</h5>
                                    <Badge bg={getStatusColor(order.status)} className="text-uppercase px-3 rounded-pill">
                                        {order.status}
                                    </Badge>
                                </div>

                                {/* Row 2: Date & Price */}
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <small className="text-muted">{new Date(order.created_at).toLocaleDateString()}</small>
                                    <span className="fw-bold fs-5" style={{ color: '#28a745' }}>{formatToPesos(order.total_amount)}</span>
                                </div>

                                {/* Row 3: Items & Action Link */}
                                <div className="d-flex justify-content-between align-items-center mt-2">
                                    <div className="d-flex align-items-center text-secondary small">
                                        <i className="bi bi-box-seam me-2 fs-5"></i> 
                                        <span>{order.order_items.length} Items</span>
                                        <span className="mx-2 text-muted">|</span>
                                        <Button variant="link" className="p-0 text-decoration-none fw-bold text-primary" style={{fontSize: '0.9rem'}} onClick={() => handleViewDetails(order)}>
                                            View Details
                                        </Button>
                                    </div>

                                    {/* Action Buttons (Only show relevant ones) */}
                                    <div className="d-flex gap-2">
                                        {(order.status === 'Pending' || order.status === 'Processing') && (
                                            <Button variant="outline-danger" size="sm" className="rounded-pill px-3 py-1 fw-bold" onClick={(e) => openActionModal('cancel', order.id, e)}>Cancel</Button>
                                        )}
                                        {order.status === 'Shipped' && (
                                            <>
                                                <Button variant="outline-warning" size="sm" className="rounded-pill px-3 py-1 fw-bold" onClick={(e) => openActionModal('request_cancel', order.id, e)}>Return</Button>
                                                <Button variant="success" size="sm" className="rounded-pill px-3 py-1 fw-bold" onClick={(e) => openActionModal('receive', order.id, e)}>Received</Button>
                                            </>
                                        )}
                                        {order.status === 'Delivered' && (
                                            <Button variant="success" size="sm" className="rounded-pill px-3 py-1 fw-bold" onClick={(e) => openActionModal('receive', order.id, e)}>Received</Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
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
            </div>
            
            <ActionModal show={modalConfig.show} handleClose={() => !isProcessingAction && setModalConfig({...modalConfig, show: false})} handleConfirm={handleActionConfirm} {...modalConfig} isLoading={isProcessingAction} />
            <OrderDetailsModal show={showDetailsModal} handleClose={() => setShowDetailsModal(false)} order={selectedOrder} />
        </div>
    );
};

export default OrderHistory;