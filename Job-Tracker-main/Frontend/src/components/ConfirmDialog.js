import React from 'react';
import Modal from './Modal';

/**
 * Reusable confirm-before-delete dialog.
 * Usage: <ConfirmDialog isOpen={...} onConfirm={...} onClose={...} />
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title="">
      <div className="confirm-body">
        <div className="confirm-icon">🗑️</div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-msg">{message || 'This action cannot be undone.'}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
