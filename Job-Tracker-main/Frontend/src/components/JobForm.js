import React, { useState, useEffect } from 'react';
import { JOB_STATUSES, EMPLOYMENT_TYPES, PRIORITIES, INTERVIEW_TYPES } from '../utils/constants';

const EMPTY_FORM = {
  companyName: '',
  jobTitle: '',
  location: '',
  employmentType: 'Full Time',
  jobUrl: '',
  salary: '',
  status: 'Saved',
  priority: 'Medium',
  appliedDate: '',
  deadline: '',
  notes: '',
  skills: '',
  interview: {
    scheduled: false,
    date: '',
    time: '',
    type: '',
    notes: '',
  },
};

const toDateInput = (val) => {
  if (!val) return '';
  return new Date(val).toISOString().split('T')[0];
};

/**
 * JobForm handles both creating and editing a job application.
 * Props:
 *   initialData  — job object to pre-populate (edit mode)
 *   onSubmit     — called with form data
 *   onClose      — called when user cancels
 *   loading      — disable submit while saving
 */
const JobForm = ({ initialData, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        companyName: initialData.companyName || '',
        jobTitle: initialData.jobTitle || '',
        location: initialData.location || '',
        employmentType: initialData.employmentType || 'Full Time',
        jobUrl: initialData.jobUrl || '',
        salary: initialData.salary || '',
        status: initialData.status || 'Saved',
        priority: initialData.priority || 'Medium',
        appliedDate: toDateInput(initialData.appliedDate),
        deadline: toDateInput(initialData.deadline),
        notes: initialData.notes || '',
        skills: Array.isArray(initialData.skills) ? initialData.skills.join(', ') : '',
        interview: {
          scheduled: initialData.interview?.scheduled || false,
          date: toDateInput(initialData.interview?.date),
          time: initialData.interview?.time || '',
          type: initialData.interview?.type || '',
          notes: initialData.interview?.notes || '',
        },
      });
    }
  }, [initialData]);

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const setInterview = (field) => (e) =>
    setForm({
      ...form,
      interview: {
        ...form.interview,
        [field]: field === 'scheduled' ? e.target.checked : e.target.value,
      },
    });

  const validate = () => {
    const errs = {};
    if (!form.companyName.trim()) errs.companyName = 'Company name is required';
    if (!form.jobTitle.trim()) errs.jobTitle = 'Job title is required';
    if (form.jobUrl && !/^https?:\/\/.+/.test(form.jobUrl)) {
      errs.jobUrl = 'Must be a valid URL starting with http:// or https://';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const skills = form.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSubmit({
      ...form,
      skills,
      appliedDate: form.appliedDate || undefined,
      deadline: form.deadline || undefined,
      interview: {
        ...form.interview,
        date: form.interview.date || undefined,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* ---- Basic info ---- */}
      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label" htmlFor="jf-company">Company Name *</label>
          <input
            id="jf-company"
            className={`form-input${errors.companyName ? ' form-input-error' : ''}`}
            type="text"
            placeholder="e.g. Google"
            value={form.companyName}
            onChange={set('companyName')}
          />
          {errors.companyName && <span className="form-error">⚠ {errors.companyName}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="jf-title">Job Title *</label>
          <input
            id="jf-title"
            className={`form-input${errors.jobTitle ? ' form-input-error' : ''}`}
            type="text"
            placeholder="e.g. Software Engineering Intern"
            value={form.jobTitle}
            onChange={set('jobTitle')}
          />
          {errors.jobTitle && <span className="form-error">⚠ {errors.jobTitle}</span>}
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label" htmlFor="jf-location">Location</label>
          <input
            id="jf-location"
            className="form-input"
            type="text"
            placeholder="e.g. San Francisco, CA or Remote"
            value={form.location}
            onChange={set('location')}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="jf-type">Employment Type</label>
          <select id="jf-type" className="form-select" value={form.employmentType} onChange={set('employmentType')}>
            {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label" htmlFor="jf-url">Job Posting URL</label>
          <input
            id="jf-url"
            className={`form-input${errors.jobUrl ? ' form-input-error' : ''}`}
            type="url"
            placeholder="https://company.com/jobs/..."
            value={form.jobUrl}
            onChange={set('jobUrl')}
          />
          {errors.jobUrl && <span className="form-error">⚠ {errors.jobUrl}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="jf-salary">Salary / Stipend</label>
          <input
            id="jf-salary"
            className="form-input"
            type="text"
            placeholder="e.g. $120,000 / $30/hr"
            value={form.salary}
            onChange={set('salary')}
          />
        </div>
      </div>

      {/* ---- Status / Priority ---- */}
      <div className="form-row-3">
        <div className="form-group">
          <label className="form-label" htmlFor="jf-status">Status</label>
          <select id="jf-status" className="form-select" value={form.status} onChange={set('status')}>
            {JOB_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="jf-priority">Priority</label>
          <select id="jf-priority" className="form-select" value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="jf-applied">Applied Date</label>
          <input id="jf-applied" className="form-input" type="date" value={form.appliedDate} onChange={set('appliedDate')} />
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label" htmlFor="jf-deadline">Application Deadline</label>
          <input id="jf-deadline" className="form-input" type="date" value={form.deadline} onChange={set('deadline')} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="jf-skills">Skills (comma-separated)</label>
          <input
            id="jf-skills"
            className="form-input"
            type="text"
            placeholder="React, Node.js, Python"
            value={form.skills}
            onChange={set('skills')}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="jf-notes">Notes</label>
        <textarea
          id="jf-notes"
          className="form-textarea"
          placeholder="Any notes about this application, recruiter contact, referral info…"
          value={form.notes}
          onChange={set('notes')}
          rows={3}
        />
      </div>

      {/* ---- Interview section ---- */}
      <hr className="divider" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <input
          id="jf-interview-scheduled"
          type="checkbox"
          checked={form.interview.scheduled}
          onChange={setInterview('scheduled')}
          style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <label htmlFor="jf-interview-scheduled" className="form-label" style={{ margin: 0, cursor: 'pointer', textTransform: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Interview scheduled
        </label>
      </div>

      {form.interview.scheduled && (
        <>
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label" htmlFor="jf-iv-date">Interview Date</label>
              <input id="jf-iv-date" className="form-input" type="date" value={form.interview.date} onChange={setInterview('date')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="jf-iv-time">Interview Time</label>
              <input id="jf-iv-time" className="form-input" type="time" value={form.interview.time} onChange={setInterview('time')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="jf-iv-type">Interview Type</label>
              <select id="jf-iv-type" className="form-select" value={form.interview.type} onChange={setInterview('type')}>
                <option value="">Select type</option>
                {INTERVIEW_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="jf-iv-notes">Interview Notes</label>
            <textarea
              id="jf-iv-notes"
              className="form-textarea"
              placeholder="Topics to prepare, interviewer name, format details…"
              value={form.interview.notes}
              onChange={setInterview('notes')}
              rows={2}
            />
          </div>
        </>
      )}

      <div className="modal-footer" style={{ padding: '20px 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : (initialData ? 'Save changes' : 'Add application')}
        </button>
      </div>
    </form>
  );
};

export default JobForm;
