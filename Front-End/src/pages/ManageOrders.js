import React, { useState, useEffect, useCallback } from 'react';
import { Spinner, Form, Row, Col, Card, Badge, Pagination, Button } from 'react-bootstrap'; 
import { fetchOrders, updateOrderStatus } from '../utils/api';
import '../Styles/OrderHistory.css'; 

const formatToPesos = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled'];
// 'Delivered' is locked here.
const TERMINAL_STATES = ['Completed', 'Cancelled', 'Returned', 'Delivered'];

const ManageOrders = ({ showAlert }) => { 
    const [allOrders, setAllOrders] = useState([]); 
    const [filteredOrders, setFilteredOrders] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    
    const [activeFilter, setActiveFilter] = useState('All'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); 

    const [stats, setStats] = useState({ totalRevenue: 0, pendingCount: 0, returnRequestCount: 0 });

    const getOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchOrders(); 
            const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setAllOrders(sortedData);
            
            const revenue = sortedData
                .filter(o => o.status === 'Completed') 
                .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
            
            const pending = sortedData.filter(o => o.status === 'Pending').length;
            const returns = sortedData.filter(o => o.status === 'Return Requested').length;
            
            setStats({
                totalRevenue: revenue,
                pendingCount: pending,
                returnRequestCount: returns
            });

        } catch (err) {
            console.error(err);
            if (localStorage.getItem('token')) {
                showAlert('Failed to fetch orders.', 'danger');
            }
        } finally {
            if (localStorage.getItem('token')) {
                setIsLoading(false);
            }
        }
    }, [showAlert]);

    useEffect(() => {
        getOrders();
    }, [getOrders]);

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
        
        const currentOrder = allOrders.find(o => o.id === orderId);
        const isReturnRequest = currentOrder?.status === 'Return Requested';

        try {
            const updatedOrder = await updateOrderStatus(orderId, newStatus);
            
            if (newStatus === 'Cancelled') {
                showAlert(`Order #${orderId} cancellation APPROVED.`, 'success');
            } 
            else if (isReturnRequest && newStatus === 'Shipped') {
                const revertedStatus = updatedOrder?.status || 'Previous Status';
                showAlert(`Order #${orderId} cancellation REJECTED. Status reverted to ${revertedStatus}.`, 'info');
            } 
            else {
                const finalStatus = updatedOrder?.status || newStatus;
                showAlert(`Order #${orderId} updated to ${finalStatus}`, 'success');
            }
            
            getOrders(); 
        } catch (error) {
            if (localStorage.getItem('token')) {
                showAlert('Failed to update status', 'danger');
            }
        } finally {
            if (localStorage.getItem('token')) {
                setUpdatingOrderId(null);
            }
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const renderPaginationItems = () => {
        const items = [];
        
        const createItem = (number) => (
            <Pagination.Item 
                key={number} 
                active={number === currentPage} 
                onClick={() => paginate(number)}
                className="custom-page-item"
            >
                {number}
            </Pagination.Item>
        );

        const createEllipsis = (key) => (
            <Pagination.Item 
                key={key}
                disabled
                className="custom-page-item"
            >
                ...
            </Pagination.Item>
        );

        if (totalPages <= 7) {
            for (let number = 1; number <= totalPages; number++) {
                items.push(createItem(number));
            }
        } else {
            items.push(createItem(1));

            if (currentPage > 4) {
                items.push(createEllipsis('start-ellipsis'));
            }

            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 4) {
                endPage = 5;
            }
            if (currentPage >= totalPages - 3) {
                startPage = totalPages - 4;
            }

            for (let number = startPage; number <= endPage; number++) {
                items.push(createItem(number));
            }

            if (currentPage < totalPages - 3) {
                items.push(createEllipsis('end-ellipsis'));
            }

            items.push(createItem(totalPages));
        }
        return items;
    };

    const renderOrderItems = (orderItems) => (
        <ul className="order-items-list">
            {orderItems.map(item => (
                <li key={item.id} className="order-item-detail">
                    <span className="item-name"><strong>{item.product?.product_name || 'Unknown'}</strong></span>
                    <span className="item-qty">Qty: {item.quantity}</span>
                    <span className="item-price text-dark">{formatToPesos(item.price_at_purchase)}</span>
                </li>
            ))}
        </ul>
    );

    if (isLoading) {
        return (
            <div className="order-history-container d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="success" style={{ width: '3rem', height: '3rem' }} />
            </div>
        );
    }

    const filterOptions = ['All', ...STATUS_OPTIONS, 'Return Requested'];

    return (
        <div className="order-history-container" style={{ maxWidth: '1200px' }}>
            <style>
                {`
                    .custom-page-item .page-link {
                        color: #198754;
                        border-color: #dee2e6;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 3px;
                        font-weight: 600;
                        cursor: pointer;
                    }
                    .custom-page-item.active .page-link {
                        background-color: #198754 !important;
                        border-color: #198754 !important;
                        color: white !important;
                    }
                    .custom-page-item .page-link:hover {
                        background-color: #e8f5e9;
                        border-color: #198754;
                        color: #198754;
                    }
                    .custom-page-item.active .page-link:hover {
                        background-color: #157347 !important;
                        color: white !important;
                    }
                    .custom-page-item.disabled .page-link {
                        background-color: #fff !important;
                        color: #6c757d !important;
                        border-color: #dee2e6 !important;
                        cursor: default !important;
                    }
                `}
            </style>

            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h1 className="mb-0 border-0 p-0">Manage Orders</h1>
            </div>

            <Row className="mb-4 g-3">
                <Col md={4}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: '#e8f5e9' }}>
                        <Card.Body className="text-center">
                            <h6 className="text-success text-uppercase fw-bold mb-1">Total Revenue</h6>
                            <h3 className="mb-0 fw-bold text-dark">{formatToPesos(stats.totalRevenue)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: stats.returnRequestCount > 0 ? '#ffebee' : '#fff3cd' }}>
                        <Card.Body className="text-center">
                            <h6 className={stats.returnRequestCount > 0 ? "text-danger text-uppercase fw-bold mb-1" : "text-warning text-uppercase fw-bold mb-1"}>
                                {stats.returnRequestCount > 0 ? 'Cancellation Requests' : 'Pending Action'}
                            </h6>
                            <h3 className="mb-0 fw-bold text-dark">
                                {stats.returnRequestCount > 0 ? stats.returnRequestCount : stats.pendingCount}
                            </h3>
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
            
            <div className="d-flex flex-column flex-md-row gap-3 mb-4">
                <div className="order-search-container flex-grow-1">
                    <input 
                        type="text" 
                        className="order-search-input w-100" 
                        placeholder="Search by ID, Customer, or Product..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-muted text-nowrap">Filter By:</span>
                    <Form.Select 
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        className="shadow-sm border-success text-success fw-bold"
                        style={{ minWidth: '200px', borderRadius: '20px' }}
                    >
                        {filterOptions.map((status) => {
                            const count = allOrders.filter(o => status === 'All' ? true : o.status === status).length;
                            return (
                                <option key={status} value={status}>
                                    {status} ({count})
                                </option>
                            );
                        })}
                    </Form.Select>
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center py-5"><h4 className="text-muted">No orders found.</h4></div>
            ) : (
                <>
                    <Row>
                        {currentItems.map(order => {
                            const isTerminal = TERMINAL_STATES.includes(order.status);
                            const isRequest = order.status === 'Return Requested';

                            return (
                                <Col lg={6} key={order.id} className="mb-4">
                                    <div className={`order-card h-100 ${isTerminal ? 'opacity-75' : ''}`} 
                                         style={{ borderLeft: isRequest ? '5px solid #dc3545' : '1px solid #eaeaea' }}>
                                        
                                        <div className="order-header">
                                            <div>
                                                <h2>#{order.id}</h2>
                                                <div className="small text-muted mt-1">
                                                    <i className="bi bi-person-fill me-1"></i>
                                                    {order.user ? `${order.user.first_name} ${order.user.last_name}` : 'Guest'}
                                                </div>
                                            </div>
                                            <Badge bg={isRequest ? 'danger' : 'secondary'} className="order-status text-uppercase">
                                                {order.status}
                                            </Badge>
                                        </div>

                                        <div className="px-4 py-2">
                                            {isRequest && (
                                                <div className="alert alert-danger py-2 mb-3 small d-flex align-items-center">
                                                    <i className="bi bi-exclamation-circle-fill me-2 fs-5"></i>
                                                    <div>User requested cancellation. Action required.</div>
                                                </div>
                                            )}

                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Total:</span>
                                                <strong className="text-success">{formatToPesos(order.total_amount)}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Payment:</span>
                                                <strong>{order.payment_type}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Date:</span>
                                                <span className="text-end" style={{ fontSize: '0.9rem' }}>{new Date(order.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="mb-3">
                                                <span className="text-muted d-block mb-1">Shipping To:</span>
                                                <div className="bg-light p-2 rounded small text-dark">
                                                    {order.shipping_address}
                                                </div>
                                            </div>

                                            <div className="border-top pt-3 mt-3">
                                                <h6 className="fw-bold text-muted text-uppercase small mb-2">Items ({order.order_items.length})</h6>
                                                {renderOrderItems(order.order_items)}
                                            </div>
                                        </div>

                                        <div className="order-card-footer mt-auto d-flex justify-content-between align-items-center bg-white border-top p-3">
                                            
                                            {isRequest ? (
                                                <div className="w-100 d-flex justify-content-between align-items-center">
                                                    <span className="small text-danger fw-bold">Request Pending:</span>
                                                    <div className="d-flex gap-2">
                                                        <Button 
                                                            variant="outline-secondary" 
                                                            size="sm"
                                                            className="rounded-pill fw-bold px-3"
                                                            onClick={() => handleStatusChange(order.id, 'Shipped')}
                                                            disabled={updatingOrderId === order.id}
                                                        >
                                                            Reject Return
                                                        </Button>
                                                        <Button 
                                                            variant="danger" 
                                                            size="sm"
                                                            className="rounded-pill fw-bold px-3"
                                                            onClick={() => handleStatusChange(order.id, 'Cancelled')}
                                                            disabled={updatingOrderId === order.id}
                                                        >
                                                            {updatingOrderId === order.id ? <Spinner size="sm" animation="border" /> : 'Approve Cancel'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="small text-muted fw-bold">Update Status:</span>
                                                    <div className="d-flex align-items-center gap-2">
                                                        {updatingOrderId === order.id && <Spinner size="sm" animation="border" variant="success" />}
                                                        <Form.Select 
                                                            size="sm" 
                                                            className="shadow-none"
                                                            style={{ 
                                                                width: 'auto', 
                                                                borderRadius: '20px', 
                                                                borderColor: '#28a745',
                                                                fontWeight: '600',
                                                                cursor: isTerminal ? 'not-allowed' : 'pointer'
                                                            }}
                                                            value={order.status}
                                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                            disabled={updatingOrderId === order.id || isTerminal}
                                                        >
                                                            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </Form.Select>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4 pb-5">
                            <Pagination>
                                <Pagination.Prev 
                                    onClick={() => paginate(currentPage - 1)} 
                                    disabled={currentPage === 1} 
                                    className="custom-page-item"
                                />
                                {renderPaginationItems()}
                                <Pagination.Next 
                                    onClick={() => paginate(currentPage + 1)} 
                                    disabled={currentPage === totalPages} 
                                    className="custom-page-item"
                                />
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ManageOrders;