import {
  JOB_STATUSES,
  PRIORITIES,
  EMPLOYMENT_TYPES,
  COLUMN_IDS,
  COLUMN_NAMES,
  STATUS_COLORS,
  INTERVIEW_TYPES,
} from '../utils/constants';

describe('Frontend Constants', () => {
  test('JOB_STATUSES matches the 6 defined workflow statuses', () => {
    expect(JOB_STATUSES).toEqual([
      'Saved',
      'Applied',
      'Online Assessment',
      'Interview',
      'Offer',
      'Rejected',
    ]);
  });

  test('PRIORITIES defines Low, Medium, High', () => {
    expect(PRIORITIES).toEqual(['Low', 'Medium', 'High']);
  });

  test('EMPLOYMENT_TYPES includes Full Time, Part Time, Internship, Contract, Other', () => {
    expect(EMPLOYMENT_TYPES).toEqual(['Full Time', 'Part Time', 'Internship', 'Contract', 'Other']);
  });

  test('INTERVIEW_TYPES defines 6 interview categories', () => {
    expect(INTERVIEW_TYPES).toEqual([
      'Phone',
      'Video',
      'On-site',
      'Technical',
      'Behavioral',
      'Other',
    ]);
  });

  test('COLUMN_IDS keys map to valid JOB_STATUSES', () => {
    Object.values(COLUMN_IDS).forEach((status) => {
      expect(JOB_STATUSES).toContain(status);
    });
  });

  test('COLUMN_NAMES and STATUS_COLORS provide entries for all statuses', () => {
    JOB_STATUSES.forEach((status) => {
      expect(COLUMN_NAMES[status]).toBe(status);
      expect(STATUS_COLORS[status]).toBeDefined();
    });
  });
});
