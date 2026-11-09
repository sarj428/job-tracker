import React from 'react';
import { useDrag } from 'react-dnd';

const statusBadgeClass = {
  Saved: 'badge-saved',
  Applied: 'badge-applied',
  'Online Assessment': 'badge-assessment',
  Interview: 'badge-interview',
  Offer: 'badge-offer',
  Rejected: 'badge-rejected',
};

const priorityBadgeClass = {
  High: 'badge-priority-high',
  Medium: 'badge-priority-medium',
  Low: 'badge-priority-low',
};

const fmtDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Card = ({ task, fromColumn, onDelete, onEdit, onView }) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'CARD',
      item: { task, fromColumn },
      canDrag: !!task,
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [task, fromColumn]
  );

  if (!task) return null;

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(task._id);
  };
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(task);
  };

  return (
    <div
      ref={drag}
      className={`card${isDragging ? ' dragging' : ''}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      onClick={() => onView(task)}
      title="Click to view details"
    >
      <div className="card-top">
        <div style={{ minWidth: 0 }}>
          <div className="card-company">{task.companyName}</div>
          <div className="card-title">{task.jobTitle}</div>
        </div>
        <div className="card-actions">
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleEdit}
            title="Edit"
            style={{ fontSize: 13, color: 'var(--text-muted)' }}
          >
            ✎
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleDelete}
            title="Delete"
            style={{ fontSize: 15, color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>
      </div>

      {task.location && (
        <div className="card-location">
          <span>📍</span> {task.location}
        </div>
      )}

      <div className="card-meta">
        <span className={`badge ${statusBadgeClass[task.status] || ''}`}>{task.status}</span>
        <span className={`badge ${priorityBadgeClass[task.priority] || ''}`}>{task.priority}</span>
        {task.appliedDate && <span className="card-meta-item">📅 {fmtDate(task.appliedDate)}</span>}
        {task.interview?.scheduled && (
          <span className="card-meta-item" style={{ color: 'var(--warning)' }}>
            🎙 Interview
          </span>
        )}
      </div>
    </div>
  );
};

export default Card;
