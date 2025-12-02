import React, { useContext, useState } from 'react'; 
import { Row, Col, Image, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { CartContext } from '../context/CartContext';
// Ensure this matches your file path exactly
import { calculateSellingPrice } from '../utils/PricingUtils'; 
import '../Styles/CartItem.css'; 

const CartItem = ({ item }) => {
  const {
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    selectedItems,
    toggleSelectItem,
    loading: contextLoading
  } = useContext(CartContext);

  // --- State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  if (!item) return null;

  const product = item.product || {};
  const isSelected = selectedItems.includes(item.id);

  // --- Handlers ---
  
  const initiateRemove = () => {
      setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
      if (!isRemoving) {
        setShowDeleteModal(false);
      }
  };

  const confirmRemove = async () => {
      try {
          setIsRemoving(true);
          await removeFromCart(item.id); 
          setShowDeleteModal(false);
      } catch (error) {
          console.error("Failed to remove item:", error);
          setIsRemoving(false);
          alert("Failed to remove item. Please try again.");
      }
  };

  const handleDecrease = () => {
      if (item.quantity === 1) {
          initiateRemove();
      } else {
          decreaseQuantity(item.id);
      }
  };

  const handleIncrease = () => {
      const currentQuantity = item.quantity || 0;
      const stock = product.stock || 0;

      if (currentQuantity + 1 > stock) {
          alert(`Cannot add more than ${stock} units of ${product.product_name}.`);
          return;
      }

      increaseQuantity(item.id);
  };

  // --- Price Logic ---
  const quantity = item.quantity || 0;
  const price = parseFloat(product.price) || 0;
  const discount = parseFloat(product.discount) || 0;
  
  // 1. Calculate the Selling Price (Discounted)
  const sellingPrice = calculateSellingPrice(price, discount);

  // 2. Determine if we need to show the "Discounted" UI
  const hasDiscount = discount > 0 && discount <= 100;

  return (
    <>
      <Row className="align-items-center cart-item-row g-0 shadow-sm mb-3 bg-white rounded border"> 
        {/* 1. Left: Checkbox & Image */}
        <Col xs={4} md={2} className="d-flex align-items-center p-2">
          <Form.Check
            type="checkbox"
            id={`select-item-${item.id}`}
            checked={isSelected}
            onChange={() => toggleSelectItem(item.id)}
            aria-label={`Select ${product.product_name}`}
            className="me-2"
          />
          <div className="cart-item-img-wrapper" style={{width: '80px', height: '80px'}}>
             <Image 
                src={product.image_url || '/img/placeholder.png'} 
                alt={product.product_name} 
                fluid 
                rounded 
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                onError={(e) => { e.target.onerror = null; e.target.src = '/img/placeholder.png'; }}
             />
          </div>
        </Col>

        {/* 2. Middle: Info */}
        <Col xs={4} md={4} className="ps-2">
          <h5 className="cart-item-name text-truncate mb-1" title={product.product_name}>
              {product.product_name || 'Unknown Product'}
          </h5> 
          
          {/* Unit Price Display */}
          <div className="cart-item-price-info">
              {hasDiscount ? (
                  <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center">
                    <span className="text-muted text-decoration-line-through me-2 small">₱{price.toFixed(2)}</span>
                    <span className="text-success fw-bold me-2">₱{sellingPrice.toFixed(2)}</span>
                    <span className="badge bg-danger" style={{fontSize: '0.65rem'}}>{discount}% OFF</span>
                  </div>
              ) : (
                  <p className="cart-item-unit-price mb-0 text-muted small">
                      Unit: ₱{sellingPrice.toFixed(2)}
                  </p> 
              )}
          </div>
        </Col>

        {/* 3. Right: Actions (Qty, Total, Remove) */}
        <Col xs={4} md={6}>
          <div className="cart-item-actions d-flex flex-column flex-md-row align-items-end align-items-md-center justify-content-md-between p-2">
              
              {/* Qty Controls */}
              <div className="qty-controls d-flex align-items-center mb-1 mb-md-0">
                  <Button variant="outline-secondary" size="sm" className="qty-btn" onClick={handleDecrease} disabled={contextLoading || isRemoving}>-</Button>
                  <span className="qty-val mx-2 fw-bold">{quantity}</span>
                  <Button variant="outline-secondary" size="sm" className="qty-btn" onClick={handleIncrease} disabled={contextLoading || isRemoving}>+</Button>
              </div>

              {/* Line Total Price (Quantity * Discounted Price) */}
              <strong className="cart-item-total mb-1 mb-md-0 mx-md-3 text-success">
                  ₱{(quantity * sellingPrice).toFixed(2)}
              </strong> 
              
              {/* Remove Link */}
              <div onClick={initiateRemove} className="cart-item-remove text-danger" role="button" style={{cursor: 'pointer'}}>
                  <small><i className="bi bi-trash"></i> Remove</small>
              </div>
          </div>
        </Col>
      </Row>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal 
        show={showDeleteModal} 
        onHide={handleCloseModal} 
        centered
        backdrop={isRemoving ? 'static' : true} 
        keyboard={!isRemoving}
      >
        <Modal.Header closeButton={!isRemoving}>
          <Modal.Title>Remove Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove <strong>{product.product_name}</strong> from your cart?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={isRemoving}>
            Cancel
          </Button>
          
          <Button variant="danger" onClick={confirmRemove} disabled={isRemoving}>
            {isRemoving ? (
                <>
                    <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                    />
                    Removing...
                </>
            ) : (
                'Remove'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CartItem;