import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';

const DeleteProduct = ({ show, handleClose, product, handleConfirmDelete, deletionStatus }) => {
  if (!product) return null;

  // Render logic based on status
  const renderContent = () => {
    switch (deletionStatus) {
      case 'deleting':
        return (
          <div className="text-center py-4">
            <Spinner animation="border" variant="danger" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <h5 className="mt-3">Deleting Product...</h5>
            <p className="text-muted">Please wait.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-4">
            <div style={{ fontSize: '3rem', color: '#28a745', marginBottom: '10px' }}>
              <i className="bi bi-check-circle-fill"></i> {/* Requires Bootstrap Icons or FontAwesome */}
              ✔ 
            </div>
            <h4 className="text-success">Deleted Successfully!</h4>
            <p>This modal will close in 5 seconds.</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-4">
            <div style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '10px' }}>
              ✖
            </div>
            <h4 className="text-danger">Deletion Failed</h4>
            <p>Something went wrong. Please try again.</p>
          </div>
        );

      case 'idle':
      default:
        return (
          <>
            <p>
              Are you sure you want to delete the product: <strong>{product.product_name}</strong>?
            </p>
            <p className="text-danger small">
              This action cannot be undone.
            </p>
          </>
        );
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop={deletionStatus === 'deleting' ? 'static' : true} keyboard={deletionStatus !== 'deleting'}>
      <Modal.Header closeButton={deletionStatus === 'idle' || deletionStatus === 'error'}>
        <Modal.Title>
            {deletionStatus === 'idle' ? 'Confirm Deletion' : 'Status'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {renderContent()}
      </Modal.Body>

      {/* Only show Footer buttons when we are in 'idle' state (asking for confirmation) */}
      {deletionStatus === 'idle' && (
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleConfirmDelete(product.id)}>
            Delete Product
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default DeleteProduct;