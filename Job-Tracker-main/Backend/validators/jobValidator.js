const { body, validationResult } = require('express-validator');

/**
 * Runs validation rules and short-circuits with 422 if any fail.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const VALID_STATUSES = ['Saved', 'Applied', 'Online Assessment', 'Interview', 'Offer', 'Rejected'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_EMPLOYMENT_TYPES = ['Full Time', 'Part Time', 'Internship', 'Contract', 'Other'];
const VALID_INTERVIEW_TYPES = ['Phone', 'Video', 'On-site', 'Technical', 'Behavioral', 'Other'];

const registerRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name').optional().trim().isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const createJobRules = [
  body('companyName')
    .trim()
    .notEmpty().withMessage('Company name is required')
    .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters'),
  body('jobTitle')
    .trim()
    .notEmpty().withMessage('Job title is required')
    .isLength({ max: 100 }).withMessage('Job title cannot exceed 100 characters'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('employmentType')
    .optional()
    .isIn(VALID_EMPLOYMENT_TYPES)
    .withMessage(`Employment type must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}`),
  body('jobUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: true })
    .withMessage('Job URL must be a valid URL (include https://)'),
  body('salary').optional().trim().isLength({ max: 100 }).withMessage('Salary cannot exceed 100 characters'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`),
  body('appliedDate').optional({ checkFalsy: true }).isISO8601().withMessage('Applied date must be a valid date'),
  body('deadline').optional({ checkFalsy: true }).isISO8601().withMessage('Deadline must be a valid date'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('skills.*').optional().trim().isLength({ max: 50 }).withMessage('Individual skill names cannot exceed 50 characters'),
  body('interview.scheduled').optional().isBoolean().withMessage('interview.scheduled must be a boolean'),
  body('interview.date').optional({ checkFalsy: true }).isISO8601().withMessage('Interview date must be a valid date'),
  body('interview.time').optional().trim().isLength({ max: 50 }).withMessage('Interview time cannot exceed 50 characters'),
  body('interview.type')
    .optional({ checkFalsy: true })
    .isIn(VALID_INTERVIEW_TYPES)
    .withMessage(`Interview type must be one of: ${VALID_INTERVIEW_TYPES.join(', ')}`),
  body('interview.notes').optional().trim().isLength({ max: 1000 }).withMessage('Interview notes cannot exceed 1000 characters'),
];

const updateJobRules = [
  body('companyName')
    .optional()
    .trim()
    .notEmpty().withMessage('Company name cannot be empty')
    .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters'),
  body('jobTitle')
    .optional()
    .trim()
    .notEmpty().withMessage('Job title cannot be empty')
    .isLength({ max: 100 }).withMessage('Job title cannot exceed 100 characters'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('employmentType')
    .optional()
    .isIn(VALID_EMPLOYMENT_TYPES)
    .withMessage(`Employment type must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}`),
  body('jobUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: true })
    .withMessage('Job URL must be a valid URL (include https://)'),
  body('salary').optional().trim().isLength({ max: 100 }).withMessage('Salary cannot exceed 100 characters'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`),
  body('appliedDate').optional({ checkFalsy: true }).isISO8601().withMessage('Applied date must be a valid date'),
  body('deadline').optional({ checkFalsy: true }).isISO8601().withMessage('Deadline must be a valid date'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('skills.*').optional().trim().isLength({ max: 50 }).withMessage('Individual skill names cannot exceed 50 characters'),
  body('interview.scheduled').optional().isBoolean().withMessage('interview.scheduled must be a boolean'),
  body('interview.date').optional({ checkFalsy: true }).isISO8601().withMessage('Interview date must be a valid date'),
  body('interview.time').optional().trim().isLength({ max: 50 }).withMessage('Interview time cannot exceed 50 characters'),
  body('interview.type')
    .optional({ checkFalsy: true })
    .isIn(VALID_INTERVIEW_TYPES)
    .withMessage(`Interview type must be one of: ${VALID_INTERVIEW_TYPES.join(', ')}`),
  body('interview.notes').optional().trim().isLength({ max: 1000 }).withMessage('Interview notes cannot exceed 1000 characters'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  createJobRules,
  updateJobRules,
};
