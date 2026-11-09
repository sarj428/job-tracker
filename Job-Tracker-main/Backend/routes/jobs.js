const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getJobs,
  getJobStats,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');
const { createJobRules, updateJobRules, validate } = require('../validators/jobValidator');

// All job routes require authentication
router.use(auth);

// Stats must come before /:id so it is not swallowed as an ID param
router.get('/stats', getJobStats);

router.get('/', getJobs);
router.post('/', createJobRules, validate, createJob);
router.get('/:id', getJobById);
router.patch('/:id', updateJobRules, validate, updateJob);
router.delete('/:id', deleteJob);

module.exports = router;
