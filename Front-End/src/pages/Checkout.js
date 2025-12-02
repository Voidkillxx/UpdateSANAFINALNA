import React, { useContext, useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, ListGroup, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { calculateSellingPrice } from '../utils/PricingUtils';
import { checkout, fetchProfile } from '../utils/api'; 
import '../Styles/Checkout.css';

const Checkout = ({ showAlert }) => {
  const { cartItems, selectedItems, setSelectedItems, selectedSubtotal, refreshCart, loading: cartLoading } = useContext(CartContext);
  const navigate = useNavigate();
  
  const [validated, setValidated] = useState(false);
  const [showConfirmOrderModal, setShowConfirmOrderModal] = useState(false);
  
  // Form State
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '', lastName: '', address: '', city: '', zip: '', phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Filter items
  const itemsToCheckout = cartItems.filter(item => selectedItems.includes(item.id));
  const subtotal = selectedSubtotal || 0;
  const shippingFee = 50.0;
  const total = subtotal + shippingFee;

  // --- 1. FETCH USER DATA ON MOUNT ---
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await fetchProfile();
        if (user) {
            setShippingAddress({
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                address: user.address || '',
                city: 'Cabuyao City', 
                zip: user.zipcode || '',
                phone: user.phone_number || ''
            });
        }
      } catch (error) {
        console.error("Failed to load user data for checkout", error);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadUserData();
  }, []);

  // --- Handlers ---
  const handleInputChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.id]: e.target.value });
  };

  const handleShowConfirmOrderModal = () => setShowConfirmOrderModal(true);
  const handleCloseConfirmOrderModal = () => setShowConfirmOrderModal(false);

  const handleConfirmOrderPlacement = async () => {
    setLoading(true);
    try {
        const coreAddress = `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.zip}`;
        
        const payload = {
            shipping_address: coreAddress, 
            payment_type: paymentMethod === 'cod' ? 'Cash On Delivery' : 'Card',
            selected_items: selectedItems 
        };

        const response = await checkout(payload); 

        if (showAlert) showAlert('Order placed successfully!', 'success');
        
        setOrderDetails({
            id: response.order_id,
            items: itemsToCheckout,
            subtotal,
            shipping: shippingFee,
            total,
            paymentMethod
        });

        setSelectedItems([]);
        sessionStorage.removeItem('cart_selected_items');

        await refreshCart(); 
        
        setOrderPlaced(true);
        handleCloseConfirmOrderModal();

    } catch (error) {
        console.error(error);
        if (showAlert) showAlert(error.message || 'Failed to place order.', 'danger');
        handleCloseConfirmOrderModal();
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }

    setValidated(true);
    handleShowConfirmOrderModal();
  };

  // --- RENDER: LOADING STATE ---
  // FIX: Wait for Cart Context to finish loading before showing "No Items" error
  if (cartLoading || loadingProfile) {
    return (
        <Container className="my-5 text-center py-5">
            <Spinner animation="border" variant="success" />
            <p className="mt-3 text-muted">Preparing checkout...</p>
        </Container>
    );
  }

  // --- RENDER: EMPTY STATE ---
  if (!orderPlaced && itemsToCheckout.length === 0) {
    return (
      <Container className="my-5 text-center">
        <h2>No Items Selected</h2>
        <p className="lead text-muted">Please go back to your cart and select the items you wish to purchase.</p>
        <Button variant="outline-primary" onClick={() => navigate('/cart')} className="mt-3">
          <i className="bi bi-arrow-left me-2"></i>Back to Cart
        </Button>
      </Container>
    );
  }

  // --- RENDER: SUCCESS STATE ---
  if (orderPlaced && orderDetails) {
    return (
      <Container className="my-3 my-md-5 checkout-container">
        <div className="order-receipt text-center p-5 bg-white rounded shadow-sm">
          <h2 className="text-success mb-3"><i className="bi bi-check-circle-fill me-2"></i>Order Successful!</h2>
          <p className="mb-4">Thank you for your purchase. Your Order ID is <strong>#{orderDetails.id}</strong>.</p>
          
          <Card className="mb-4 text-start mx-auto" style={{maxWidth: '500px'}}>
             <Card.Header>Order Summary</Card.Header>
             <ListGroup variant="flush">
               {orderDetails.items.map(item => (
                    <ListGroup.Item key={item.id} className="d-flex justify-content-between">
                        <span>{item.product?.product_name} (x{item.quantity})</span>
                        <span>₱{(item.product?.price * item.quantity).toFixed(2)}</span>
                    </ListGroup.Item>
                ))}
                
                <div className="px-3 py-2 mt-2 bg-light border-top">
                    <div className="d-flex justify-content-between mb-1">
                        <small>Subtotal</small>
                        <small>₱{orderDetails.subtotal.toFixed(2)}</small>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                        <small>Shipping</small>
                        <small>₱{orderDetails.shipping.toFixed(2)}</small>
                    </div>
                </div>

                <ListGroup.Item className="d-flex justify-content-between fw-bold border-top">
                    <span>Total Paid</span>
                    <span className="text-success">₱{orderDetails.total.toFixed(2)}</span>
                </ListGroup.Item>
             </ListGroup>
          </Card>

          <Button variant="primary" onClick={() => navigate('/')} className="px-5">Continue Shopping</Button>
        </div>
      </Container>
    );
  }

  // --- RENDER: CHECKOUT FORM ---
  return (
    <>
      <Container className="my-3 my-md-5 checkout-container">
        <h2 className="checkout-title mb-4">Checkout</h2>
        
        <Row className="g-4">
        <Col lg={7}>
            <h4 className="mb-3 section-title">Shipping & Payment</h4>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <h5 className="mb-2 text-muted" style={{fontSize: '1rem'}}>Contact & Address</h5>
            
            <Row className="g-2">
                <Form.Group as={Col} xs={6} controlId="firstName" className="mb-3">
                <Form.Label>First name</Form.Label>
                <Form.Control required type="text" value={shippingAddress.firstName} onChange={handleInputChange} />
                </Form.Group>
                <Form.Group as={Col} xs={6} controlId="lastName" className="mb-3">
                <Form.Label>Last name</Form.Label>
                <Form.Control required type="text" value={shippingAddress.lastName} onChange={handleInputChange} />
                </Form.Group>
            </Row>

            <Form.Group className="mb-3" controlId="phone">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control required type="text" value={shippingAddress.phone} onChange={handleInputChange} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="address">
                <Form.Label>Address</Form.Label>
                <Form.Control required value={shippingAddress.address} onChange={handleInputChange} />
                <Form.Control.Feedback type="invalid">Address required.</Form.Control.Feedback>
            </Form.Group>

            <Row className="g-2">
                <Form.Group as={Col} xs={6} controlId="city" className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control type="text" required value={shippingAddress.city} onChange={handleInputChange} />
                </Form.Group>
                <Form.Group as={Col} xs={6} controlId="zip" className="mb-3">
                <Form.Label>Zip</Form.Label>
                <Form.Control type="text" required value={shippingAddress.zip} onChange={handleInputChange} />
                </Form.Group>
            </Row>

            <hr className="my-3" />

            <h5 className="mb-3 text-muted" style={{fontSize: '1rem'}}>Payment</h5>
            <div className="mb-3">
                <Form.Check type="radio" id="paymentCard" name="paymentMethod" label="Card" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} required />
                <Form.Check type="radio" id="paymentCod" name="paymentMethod" label="COD" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} required />
            </div>

            {paymentMethod === 'card' && (
                <div className="p-3 bg-light rounded mb-3 border">
                <Form.Group className="mb-2" controlId="cc-name">
                    <Form.Label>Cardholder</Form.Label>
                    <Form.Control type="text" required size="sm" />
                </Form.Group>
                <Form.Group className="mb-2" controlId="cc-number">
                    <Form.Label>Card Number</Form.Label>
                    <Form.Control type="text" required pattern="\d{13,16}" size="sm" placeholder="XXXX-XXXX-XXXX-XXXX"/>
                </Form.Group>
                <Row className="g-2">
                    <Form.Group as={Col} xs={6} controlId="cc-expiration">
                    <Form.Label>Exp (MM/YY)</Form.Label>
                    <Form.Control type="text" placeholder="MM/YY" required pattern="(0[1-9]|1[0-2])\/?([0-9]{2})" size="sm" />
                    </Form.Group>
                    <Form.Group as={Col} xs={6} controlId="cc-cvv">
                    <Form.Label>CVV</Form.Label>
                    <Form.Control type="text" placeholder="123" required pattern="\d{3,4}" size="sm" />
                    </Form.Group>
                </Row>
                </div>
            )}

            <Button variant="success" size="lg" type="submit" className="w-100 mt-2">Place Order</Button>
            </Form>
        </Col>

        <Col lg={5}>
            <Card className="checkout-summary-card">
            <Card.Header as="h6" className="bg-white py-3">Order Summary</Card.Header>
            <Card.Body className="p-3">
                <ListGroup variant="flush">
                {itemsToCheckout.map(item => {
                    const product = item.product || {};
                    const sellingPrice = calculateSellingPrice(product.price, product.discount);
                    return (
                    <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center px-0 py-2 border-bottom">
                        <div className="d-flex align-items-center" style={{overflow: 'hidden'}}>
                            <img src={product.image_url || '/img/placeholder.png'} alt={product.product_name} className="summary-item-image flex-shrink-0" style={{width:'50px', height:'50px', objectFit:'cover', borderRadius:'4px'}} />
                            <div className="summary-item-details ms-2">
                            <span className="fw-bold d-block text-truncate" style={{maxWidth: '140px'}}>{product.product_name}</span>
                            <small className="text-muted">x{item.quantity}</small>
                            </div>
                        </div>
                        <span className="text-nowrap ms-2 fw-bold" style={{fontSize: '0.9rem'}}>₱{(sellingPrice * item.quantity).toFixed(2)}</span>
                    </ListGroup.Item>
                    );
                })}
                </ListGroup>
                
                <div className="mt-3">
                <div className="d-flex justify-content-between mb-1"><small>Subtotal</small><small>₱{subtotal.toFixed(2)}</small></div>
                <div className="d-flex justify-content-between mb-2"><small>Shipping</small><small>₱{shippingFee.toFixed(2)}</small></div>
                <div className="d-flex justify-content-between h6 mb-0 text-success pt-2 border-top"><strong>Total</strong><strong>₱{total.toFixed(2)}</strong></div>
                </div>
            </Card.Body>
            </Card>
        </Col>
        </Row>
      </Container>

      <Modal show={showConfirmOrderModal} onHide={handleCloseConfirmOrderModal} centered size="sm">
        <Modal.Header closeButton><Modal.Title>Confirm Order</Modal.Title></Modal.Header>
        <Modal.Body className="text-center">Place order for <strong>{itemsToCheckout.length} item(s)</strong>? <br/>Total: <strong className="text-success">₱{total.toFixed(2)}</strong></Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={handleCloseConfirmOrderModal} disabled={loading}>Cancel</Button>
          <Button variant="success" size="sm" onClick={handleConfirmOrderPlacement} disabled={loading}>
            {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Checkout;