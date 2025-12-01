import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Nav, Spinner, Pagination } from 'react-bootstrap'; 
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

// --- Component: Action Modal (Reuseable) ---
const ActionModal = ({ show, handleClose, handleConfirm, title, message, variant, isLoading, actionText }) => {
    return (
        <Modal show={show} onHide={handleClose} centered backdrop={isLoading ? 'static' : true} keyboard={!isLoading}>
            <Modal.Header closeButton={!isLoading} className={`bg-${variant === 'danger' ? 'warning' : 'success'} text-dark`}>
                <Modal.Title><i className="bi bi-exclamation-circle-fill"></i> {title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="fw-bold">{message}</p>
                {variant === 'danger' && <p className="small text-muted">This action cannot be undone.</p>}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
                    Back
                </Button>
                <Button variant={variant} onClick={handleConfirm} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Processing...
                        </>
                    ) : (
                        actionText
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

const OrderHistory = ({ showAlert }) => { 
    const [allOrders, setAllOrders] = useState([]); 
    const [filteredOrders, setFilteredOrders] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- FILTERS ---
    const [activeFilter, setActiveFilter] = useState('All'); 
    const [searchTerm, setSearchTerm] = useState('');

    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5); // Limit to 5 per page for cleaner UI

    // --- MODAL STATES ---
    const [modalConfig, setModalConfig] = useState({
        show: false,
        type: null, 
        orderId: null,
        title: '',
        message: '',
        variant: 'primary',
        actionText: ''
    });
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    const getOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchOrders(); 
            const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setAllOrders(sortedData);
        } catch (err) {
            setError('Failed to fetch orders. Please check your network.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        getOrders();
    }, [getOrders]);

    // --- FILTER & PAGINATION LOGIC ---
    useEffect(() => {
        let result = allOrders;

        // 1. Filter Status
        if (activeFilter !== 'All') {
            result = result.filter(order => order.status.toLowerCase() === activeFilter.toLowerCase());
        }

        // 2. Search
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            result = result.filter(order => 
                order.order_items.some(item => item.product?.product_name.toLowerCase().includes(term))
            );
        }

        setFilteredOrders(result);
        setCurrentPage(1); // Reset to page 1 when filters change
    }, [allOrders, activeFilter, searchTerm]);

    // Calculate Page Slices
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0); // Scroll to top of list
    };

    // --- HANDLERS ---

    const openActionModal = (type, orderId) => {
        let config = { show: true, type, orderId, variant: 'primary', actionText: 'Confirm' };
        
        if (type === 'cancel') {
            config.title = 'Cancel Order';
            config.message = `Are you sure you want to cancel Order #${orderId}?`;
            config.variant = 'danger';
            config.actionText = 'Yes, Cancel Order';
        } else if (type === 'request_cancel') {
            config.title = 'Request Cancellation';
            config.message = `Since Order #${orderId} is already shipped, this request must be approved by an Admin. Proceed?`;
            config.variant = 'warning';
            config.actionText = 'Send Request';
        } else if (type === 'receive') {
            config.title = 'Confirm Delivery';
            config.message = `Have you received Order #${orderId}? This will mark the order as Completed.`;
            config.variant = 'success';
            config.actionText = 'Yes, Order Received';
        }

        setModalConfig(config);
    };

    const handleActionConfirm = async () => {
        setIsProcessingAction(true);
        const { type, orderId } = modalConfig;

        try {
            if (type === 'cancel') {
                await cancelOrder(orderId);
                showAlert('Order cancelled successfully.', 'success');
            } else if (type === 'request_cancel') {
                await requestCancellation(orderId); 
                showAlert('Cancellation request sent to Admin.', 'info');
            } else if (type === 'receive') {
                await receiveOrder(orderId); 
                showAlert('Order marked as received! Thank you.', 'success');
            }
            getOrders();
        } catch (err) {
            showAlert(err.message || 'Action failed.', 'danger');
        } finally {
            setIsProcessingAction(false);
            setModalConfig({ ...modalConfig, show: false });
        }
    };

    const renderOrderItems = (orderItems) => (
        <ul className="order-items-list">
            {orderItems.map(item => (
                <li key={item.id} className="order-item-detail">
                    <span className="item-name"><strong>{item.product?.product_name || 'Product Not Found'}</strong></span>
                    <span className="item-qty">Qty: {item.quantity}</span>
                    <span className="item-price text-dark">{formatToPesos(item.price_at_purchase)}</span>
                </li>
            ))}
        </ul>
    );

    if (isLoading) {
        return (
            <div className="order-history-container d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="success" style={{ width: '3rem', height: '3rem' }} />
                    <p className="mt-3 text-muted">Loading your orders...</p>
                </div>
            </div>
        );
    }

    if (error) return <div className="order-history-container"><h2 className="error-message">{error}</h2></div>;

    return (
        <div className="order-history-container">
            <h1>My Order History</h1>
            
            <div className="order-search-container">
                <input 
                    type="text" 
                    className="order-search-input" 
                    placeholder="Search orders by product name..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Nav variant="tabs" defaultActiveKey="All" className="order-status-tabs">
                {Object.entries(STATUS_FILTERS).map(([key, label]) => (
                    <Nav.Item key={key}>
                        <Nav.Link 
                            eventKey={key} 
                            active={activeFilter === key} 
                            onClick={() => setActiveFilter(key)}
                        >
                            {label} ({allOrders.filter(o => key === 'All' ? true : o.status.toLowerCase() === key.toLowerCase()).length})
                        </Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>

            <div className="order-list">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-5">
                        <h4 className="text-muted">No orders found.</h4>
                        {searchTerm && <Button variant="link" className="text-success" onClick={() => setSearchTerm('')}>Clear Search</Button>}
                    </div>
                ) : (
                    <>
                        {currentItems.map(order => (
                            <div key={order.id} className={`order-card status-${order.status.toLowerCase().replace(/\s/g, '-')}`}>
                                <div className="order-header">
                                    <h2>Order ID: #{order.id}</h2>
                                    <span className="order-status">{order.status}</span>
                                </div>

                                <p>Total: <strong>{formatToPesos(order.total_amount)}</strong></p>
                                <p className="order-date">Placed: {new Date(order.created_at).toLocaleString()}</p>
                                <p>Shipping: <strong>{order.shipping_address}</strong></p>
                                
                                <h3>Items:</h3>
                                {order.order_items && renderOrderItems(order.order_items)}

                                <div className="order-card-footer gap-2">
                                    {/* Pending/Processing -> Direct Cancel */}
                                    {(order.status === 'Pending' || order.status === 'Processing') && (
                                        <button className="cancel-button" onClick={() => openActionModal('cancel', order.id)}>
                                            Cancel Order
                                        </button>
                                    )}

                                    {/* Shipped -> Request Cancel OR Order Received */}
                                    {order.status === 'Shipped' && (
                                        <>
                                            <Button variant="outline-warning" className="rounded-pill fw-bold" onClick={() => openActionModal('request_cancel', order.id)}>
                                                Request Cancellation
                                            </Button>
                                            <Button variant="success" className="rounded-pill fw-bold" onClick={() => openActionModal('receive', order.id)}>
                                                Order Received
                                            </Button>
                                        </>
                                    )}

                                    {/* Delivered -> Order Received Only */}
                                    {order.status === 'Delivered' && (
                                        <Button variant="success" className="rounded-pill fw-bold" onClick={() => openActionModal('receive', order.id)}>
                                            Order Received
                                        </Button>
                                    )}
                                    
                                    {/* Completed/Cancelled -> View Only */}
                                    {order.status === 'Completed' && (
                                        <span className="text-success fw-bold"><i className="bi bi-check-circle-fill"></i> Order Completed</span>
                                    )}
                                    {order.status === 'Return Requested' && (
                                        <span className="text-warning fw-bold"><i className="bi bi-hourglass-split"></i> Cancellation Pending Approval</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* --- PAGINATION CONTROLS --- */}
                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-4">
                                <Pagination>
                                    <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                                    
                                    {/* Page Numbers */}
                                    {[...Array(totalPages)].map((_, index) => (
                                        <Pagination.Item 
                                            key={index + 1} 
                                            active={index + 1 === currentPage} 
                                            onClick={() => paginate(index + 1)}
                                        >
                                            {index + 1}
                                        </Pagination.Item>
                                    ))}

                                    <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <ActionModal 
                show={modalConfig.show} 
                handleClose={() => !isProcessingAction && setModalConfig({...modalConfig, show: false})} 
                handleConfirm={handleActionConfirm} 
                title={modalConfig.title}
                message={modalConfig.message}
                variant={modalConfig.variant}
                isLoading={isProcessingAction}
                actionText={modalConfig.actionText}
            />
        </div>
    );
};

export default OrderHistory;