import React from 'react';
import { JOB_STATUSES, EMPLOYMENT_TYPES, PRIORITIES } from '../utils/constants';

const SearchFilterBar = ({ filters, onFilterChange, total }) => {
  const set = (field) => (e) => onFilterChange({ ...filters, [field]: e.target.value, page: 1 });

  return (
    <div className="toolbar">
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          id="search-input"
          className="search-input"
          type="text"
          placeholder="Search company or job title…"
          value={filters.search || ''}
          onChange={set('search')}
        />
      </div>

      <select
        id="filter-status"
        className="filter-select"
        value={filters.status || ''}
        onChange={set('status')}
      >
        <option value="">All statuses</option>
        {JOB_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        id="filter-priority"
        className="filter-select"
        value={filters.priority || ''}
        onChange={set('priority')}
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        id="filter-employment"
        className="filter-select"
        value={filters.employmentType || ''}
        onChange={set('employmentType')}
      >
        <option value="">All types</option>
        {EMPLOYMENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        id="filter-sort"
        className="filter-select"
        value={filters.sort || 'newest'}
        onChange={set('sort')}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="deadline">By deadline</option>
        <option value="priority">By priority</option>
      </select>

      {total !== undefined && (
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            marginLeft: 'auto',
          }}
        >
          {total} result{total !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

export default SearchFilterBar;
