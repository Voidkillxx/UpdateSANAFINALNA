import React, { useContext, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Modal, Form, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import RemoveItemModal from '../components/RemoveItemModal';
import CartItem from '../components/CartItem';
import { calculateSellingPrice } from '../utils/PricingUtils'; 
import '../Styles/Cart.css'; 

const Cart = ({ showAlert }) => {
  const {
    cartItems,
    selectedItems,
    // selectedSubtotal, // We will ignore this and calculate locally to ensure discount accuracy
    toggleSelectAll,
    clearCart,
    removeFromCart,
    refreshCart, 
    loading
  } = useContext(CartContext);
  
  const navigate = useNavigate();

  // --- State for Modals ---
  const [showClearModal, setShowClearModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

  // --- Local state for "Clearing..." spinner ---
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAllSelected = cartItems.length > 0 && cartItems.every(item => selectedItems.includes(item.id));

  // --- TOTAL CALCULATION LOGIC ---
  // We calculate this locally to guarantee it uses the Discounted Price, not the Original Price.
  const calculatedSubtotal = cartItems.reduce((total, item) => {
      // Only add if the item is selected
      if (selectedItems.includes(item.id)) {
          const product = item.product || {};
          const price = parseFloat(product.price) || 0;
          const discount = parseFloat(product.discount) || 0;
          const qty = item.quantity || 0;

          // Use the utility to get the real selling price
          const finalPrice = calculateSellingPrice(price, discount);
          
          return total + (finalPrice * qty);
      }
      return total;
  }, 0);

  // --- Modal Handlers ---

  const handleShowClearModal = () => setShowClearModal(true);
  
  const handleCloseClearModal = () => {
      if (!isClearing) {
        setShowClearModal(false);
      }
  };

  const handleConfirmClear = async () => { 
      try {
          setIsClearing(true); 
          await clearCart();   
          setIsClearing(false); 
          setShowClearModal(false); 
          
          if(showAlert) showAlert('Cart cleared successfully!', 'success');
      } catch (error) {
          setIsClearing(false);
          if(showAlert) showAlert('Failed to clear cart.', 'danger');
      }
  };
  
  const handleShowRemoveModal = (item) => { setItemToRemove(item); setShowRemoveModal(true); };
  const handleCloseRemoveModal = () => { setItemToRemove(null); setShowRemoveModal(false); };

  // --- UPDATED: Get Product Name & Trigger Notification ---
  const handleConfirmRemove = async (itemId) => { 
      // 1. Capture the product name BEFORE deleting/closing modal
      const productName = itemToRemove?.product?.product_name || 'Item';

      // 2. Call Context function to remove item
      const success = await removeFromCart(itemId); 
      
      // 3. Close the confirmation dialog
      handleCloseRemoveModal(); 

      // 4. Show the Auto-Closing Notification Modal
      if (success) {
          if (showAlert) showAlert(`${productName} is removed from cart`, 'success');
      } else {
          if (showAlert) showAlert('Failed to remove item.', 'danger');
      }
  };

  // --- Checkout Handler ---
  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
       if (showAlert) showAlert('Please select at least one item to checkout.', 'warning');
    } else {
      navigate('/checkout');
    }
  };

  if (loading && cartItems.length === 0) {
      return (
          <Container className="my-5 text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-3 text-muted">Loading your cart...</p>
          </Container>
      );
  }

  return (
    <>
      <Container className="my-5 cart-container"> 
        <h2 className="cart-section-title">Shopping Cart</h2> 
        
        {cartItems.length === 0 ? (
          <div className="text-center py-5">
             <div className="display-1 mb-3">🛒</div>
             <h4>Your cart is empty.</h4>
             <p className="text-muted">Looks like you haven't added anything yet.</p>
             <Button as={Link} to="/" variant="success" size="lg" className="mt-3 px-4 rounded-pill">
                Start Shopping
             </Button>
          </div>
        ) : (
          <Row>
            <Col lg={8}>
              {/* Toolbar */}
              <div className="d-flex align-items-center mb-3 border-bottom pb-2">
                 <Form.Check
                   type="checkbox"
                   id="select-all"
                   label={`Select All (${cartItems.length})`}
                   checked={isAllSelected}
                   onChange={toggleSelectAll}
                   className="me-auto fw-bold"
                   disabled={loading}
                 />
                 <Button variant="outline-danger" size="sm" onClick={handleShowClearModal} disabled={loading}>
                   Clear Cart
                 </Button>
              </div>

              {/* Items List */}
              {cartItems.map(item => (
                <CartItem 
                    key={item.id} 
                    item={item} 
                    onRemove={() => handleShowRemoveModal(item)} 
                />
              ))}

            </Col>
            
            {/* Order Summary */}
            <Col lg={4}>
              <Card className="order-summary-card shadow-sm border-0"> 
                <Card.Body>
                  <Card.Title className="fw-bold mb-4">Order Summary</Card.Title>
                  <div className="d-flex justify-content-between my-2">
                    <span>Subtotal ({selectedItems.length} items)</span>
                    {/* UPDATED: Uses local calculation based on Discounted Price */}
                    <strong>₱{calculatedSubtotal.toFixed(2)}</strong>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between h5 text-success">
                    <strong>Total</strong>
                    <strong>₱{calculatedSubtotal.toFixed(2)}</strong>
                  </div>
                  <Button 
                    variant="success" 
                    className="w-100 mt-4 py-2 fw-bold" 
                    onClick={handleProceedToCheckout} 
                    disabled={selectedItems.length === 0 || loading}
                  >
                    Proceed to Checkout
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      {/* Clear Cart Modal */}
      <Modal 
        show={showClearModal} 
        onHide={handleCloseClearModal} 
        centered
        backdrop={isClearing ? 'static' : true}
        keyboard={!isClearing}
      >
          <Modal.Header closeButton={!isClearing}> 
            <Modal.Title>Clear Cart?</Modal.Title> 
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to remove all items from your cart?
          </Modal.Body>
          <Modal.Footer> 
              <Button variant="secondary" onClick={handleCloseClearModal} disabled={isClearing}>
                Cancel
              </Button> 
              <Button variant="danger" onClick={handleConfirmClear} disabled={isClearing}>
                {isClearing ? (
                    <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Clearing...
                    </>
                ) : 'Yes, Clear It'}
              </Button> 
          </Modal.Footer>
      </Modal>

      {/* Remove Item Modal */}
      <RemoveItemModal
          show={showRemoveModal}
          handleClose={handleCloseRemoveModal}
          item={itemToRemove}
          handleConfirmRemove={handleConfirmRemove}
      />
    </>
  );
};

export default Cart;