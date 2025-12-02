import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { calculateSellingPrice } from '../utils/PricingUtils'; 

const AddQuantityModal = ({ show, handleClose, product, handleAdd }) => {
  const [quantity, setQuantity] = useState(1);

  // Parse stock safely
  const availableStock = product ? (parseInt(product.stock) || 0) : 0;

  // Reset quantity when modal opens
  useEffect(() => { 
    if (show) { 
      // FIX: Only set quantity to 1 if stock > 0, otherwise set it to 0 (which disables the Add button)
      setQuantity(availableStock > 0 ? 1 : 0); 
    } 
  }, [show, availableStock]);

  const handleConfirmAdd = () => {
    // Check stock status one last time
    if (quantity > availableStock) {
        alert(`Cannot add ${quantity}. Only ${availableStock} item(s) in stock.`);
        return;
    }
    // Call the parent handler to add to cart
    handleAdd(product, quantity);
    handleClose();
  };

  const handleQuantityChange = (e) => {
    let value = parseInt(e.target.value);
    
    if (isNaN(value) || value < 1) {
      value = 1;
    } else if (value > availableStock) {
      value = availableStock;
    }
    setQuantity(value);
  };

  const handleIncrease = () => {
      setQuantity(prev => Math.min(availableStock, prev + 1));
  };

  const handleDecrease = () => {
      // Prevent quantity from dropping below 1
      setQuantity(prev => Math.max(1, prev - 1));
  };

  if (!product) return null;

  // Uses imported utility function for correct price calculation (e.g. discounts)
  const pricePerItem = calculateSellingPrice(product.price, product.discount); 

  return (
    <Modal show={show} onHide={handleClose} centered size="sm">
      <Modal.Header closeButton> <Modal.Title>Add Quantity</Modal.Title> </Modal.Header>
      <Modal.Body>
        <p>How many <strong>{product.product_name || product.name}</strong> would you like to add?</p>
        <p className="text-muted small">Available Stock: {availableStock}</p>

        <InputGroup className="mb-3">
          {/* Disable Decrease if quantity is 1 or less, or if stock is 0 */}
          <Button variant="outline-secondary" onClick={handleDecrease} disabled={quantity <= 1 || availableStock === 0}>-</Button>
          <Form.Control
            type="number"
            value={quantity}
            onChange={handleQuantityChange}
            min={1}
            max={availableStock}
            className="text-center"
            aria-label="Quantity"
            isInvalid={quantity > availableStock}
            disabled={availableStock === 0}
          />
          {/* Disable Increase if stock limit reached */}
          <Button variant="outline-secondary" onClick={handleIncrease} disabled={quantity >= availableStock}>+</Button>
        </InputGroup>
        
        {availableStock <= 0 && (
             <Alert variant="danger" size="sm">This item is out of stock.</Alert>
        )}
        {quantity > availableStock && availableStock > 0 && (
             <Alert variant="warning" size="sm">Only {availableStock} item(s) in stock.</Alert>
        )}

        <p className="text-end fw-bold">Total: ₱{(pricePerItem * quantity).toFixed(2)}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}> Cancel </Button>
        <Button
          variant="success"
          onClick={handleConfirmAdd}
          // Button is disabled if stock is 0 OR quantity is 0
          disabled={availableStock <= 0 || quantity > availableStock || quantity < 1}
         >
          Add to Cart
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddQuantityModal;