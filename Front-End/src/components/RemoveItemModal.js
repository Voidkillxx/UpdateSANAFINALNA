import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const RemoveItemModal = ({ show, handleClose, item, handleConfirmRemove }) => {
  if (!item) return null;

  const productName = item.product?.product_name || 'this item';
  const cartItemId = item.id;

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Remove Item</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to remove **{productName}** from your cart?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={() => handleConfirmRemove(cartItemId)}
        >
          Remove
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RemoveItemModal;