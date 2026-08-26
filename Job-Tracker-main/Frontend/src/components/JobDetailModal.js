import React from 'react';
import { STATUS_COLORS, PRIORITY_COLORS } from '../utils/constants';

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

const fmt = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * JobDetailModal — shows complete details of a job application.
 * Props: job, onEdit, onDelete, onClose, onStatusChange
 */
const JobDetailModal = ({ job, onEdit, onDelete, onClose }) => {
  if (!job) return null;

  const hasInterview = job.interview?.scheduled;

  return (
    <div>
      {/* Company + title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              {job.companyName}
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 10 }}>{job.jobTitle}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <span className={`badge ${statusBadgeClass[job.status] || ''}`}>{job.status}</span>
            <span className={`badge ${priorityBadgeClass[job.priority] || ''}`}>{job.priority}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={onEdit}>✎ Edit</button>
          {job.jobUrl && (
            <a
              href={job.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              ↗ Open Job Posting
            </a>
          )}
          <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>

      <hr className="divider" />

      {/* Detail grid */}
      <div className="detail-grid-2">
        <div className="detail-field">
          <div className="detail-label">Location</div>
          <div className="detail-value">{job.location || '—'}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Employment Type</div>
          <div className="detail-value">{job.employmentType || '—'}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Salary / Stipend</div>
          <div className="detail-value">{job.salary || '—'}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Applied Date</div>
          <div className="detail-value">{fmt(job.appliedDate) || '—'}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Application Deadline</div>
          <div className="detail-value">{fmt(job.deadline) || '—'}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Added</div>
          <div className="detail-value">{fmt(job.createdAt)}</div>
        </div>
      </div>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="detail-field">
          <div className="detail-label">Skills</div>
          <div className="skills-chips">
            {job.skills.map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
          </div>
        </div>
      )}

      {/* Notes */}
      {job.notes && (
        <div className="detail-field">
          <div className="detail-label">Notes</div>
          <div className="detail-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {job.notes}
          </div>
        </div>
      )}

      {/* Interview */}
      {hasInterview && (
        <>
          <hr className="divider" />
          <div className="detail-label" style={{ marginBottom: 12 }}>Interview Details</div>
          <div className="detail-grid-2">
            <div className="detail-field">
              <div className="detail-label">Date</div>
              <div className="detail-value">{fmt(job.interview.date) || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Time</div>
              <div className="detail-value">{job.interview.time || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Type</div>
              <div className="detail-value">{job.interview.type || '—'}</div>
            </div>
          </div>
          {job.interview.notes && (
            <div className="detail-field">
              <div className="detail-label">Interview Notes</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                {job.interview.notes}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobDetailModal;
