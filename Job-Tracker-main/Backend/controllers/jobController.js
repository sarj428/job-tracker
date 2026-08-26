const Job = require('../models/Job');

/**
 * GET /api/jobs
 * Supports: ?page, ?limit, ?status, ?priority, ?employmentType, ?search, ?sort
 */
const getJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      employmentType,
      search,
      sort = 'newest',
    } = req.query;

    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (employmentType) filter.employmentType = employmentType;
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      deadline: { deadline: 1 },
      priority: { priority: -1 },
    };
    const sortQuery = sortOptions[sort] || sortOptions.newest;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort(sortQuery).skip(skip).limit(limitNum),
      Job.countDocuments(filter),
    ]);

    res.json({
      success: true,
      jobs,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/jobs/stats
 */
const getJobStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const statusCounts = await Job.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Applications in the current calendar month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthCount = await Job.countDocuments({
      user: userId,
      createdAt: { $gte: startOfMonth },
    });

    // Applications per month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyData = await Job.aggregate([
      { $match: { user: userId, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Upcoming interviews (next 30 days)
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const upcomingInterviews = await Job.find({
      user: userId,
      'interview.scheduled': true,
      'interview.date': { $gte: now, $lte: in30Days },
    })
      .select('companyName jobTitle interview')
      .sort({ 'interview.date': 1 })
      .limit(5);

    // Build status map with defaults for all statuses
    const allStatuses = ['Saved', 'Applied', 'Online Assessment', 'Interview', 'Offer', 'Rejected'];
    const statusMap = {};
    allStatuses.forEach((s) => (statusMap[s] = 0));
    statusCounts.forEach(({ _id, count }) => {
      statusMap[_id] = count;
    });

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      stats: {
        total,
        thisMonth: thisMonthCount,
        byStatus: statusMap,
        offerRate: total > 0 ? ((statusMap['Offer'] / total) * 100).toFixed(1) : '0.0',
        monthly: monthlyData,
        upcomingInterviews,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/jobs/:id
 */
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job application not found' });
    }
    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/jobs
 */
const createJob = async (req, res, next) => {
  try {
    const {
      companyName, jobTitle, location, employmentType, jobUrl,
      salary, status, priority, appliedDate, deadline, notes, skills, interview,
    } = req.body;

    const job = new Job({
      companyName,
      jobTitle,
      location,
      employmentType,
      jobUrl,
      salary,
      status,
      priority,
      appliedDate,
      deadline,
      notes,
      skills: Array.isArray(skills) ? skills : [],
      interview,
      user: req.user._id,
    });

    const saved = await job.save();
    res.status(201).json({ success: true, job: saved });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/jobs/:id
 */
const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job application not found' });
    }

    const updatableFields = [
      'companyName', 'jobTitle', 'location', 'employmentType', 'jobUrl',
      'salary', 'status', 'priority', 'appliedDate', 'deadline', 'notes', 'skills', 'interview',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    const updated = await job.save();
    res.json({ success: true, job: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/jobs/:id
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job application not found' });
    }
    res.json({ success: true, message: 'Job application deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getJobs, getJobStats, getJobById, createJob, updateJob, deleteJob };
