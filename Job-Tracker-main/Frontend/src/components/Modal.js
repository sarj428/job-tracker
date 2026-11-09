import React from 'react';

/**
 * Generic modal shell. Children render inside the scrollable body.
 * size: 'sm' | 'md' | 'lg'
 */
const Modal = ({ isOpen, onClose, title, size = 'md', children, footer }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className={`modal-box modal-box-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <span className="modal-title" id="modal-title">
            {title}
          </span>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close modal"
            style={{ fontSize: '18px', color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
