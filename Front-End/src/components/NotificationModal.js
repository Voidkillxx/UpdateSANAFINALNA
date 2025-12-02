import React, { useEffect } from 'react';
import { Modal } from 'react-bootstrap';

const NotificationModal = ({ show, onClose, message, variant = 'success' }) => {
    
    // Auto-close the modal after 2 seconds
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000); // 2000ms = 2 seconds
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    const isError = variant === 'error' || variant === 'danger';
    const headerBg = isError ? 'bg-danger' : 'bg-success';

    return (
        <Modal 
            show={show} 
            onHide={onClose} 
            centered 
            backdrop={false} 
            style={{ zIndex: 1060 }}
        >
            <div className={`modal-content border-0 shadow-lg`}>
                <div className={`modal-header ${headerBg} text-white border-0 py-2`}>
                    <strong className="me-auto fs-6">Notification</strong>
                    <button 
                        type="button" 
                        className="btn-close btn-close-white" 
                        onClick={onClose} 
                    ></button>
                </div>
                <div className="modal-body text-center py-4 fw-medium text-dark">
                    {message}
                </div>
            </div>
        </Modal>
    );
};

export default NotificationModal;