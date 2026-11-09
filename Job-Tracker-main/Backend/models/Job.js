const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    scheduled: { type: Boolean, default: false },
    date: { type: Date },
    time: { type: String },
    type: {
      type: String,
      enum: ['Phone', 'Video', 'On-site', 'Technical', 'Behavioral', 'Other'],
    },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: '',
    },
    employmentType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Internship', 'Contract', 'Other'],
      default: 'Full Time',
    },
    jobUrl: {
      type: String,
      trim: true,
      default: '',
    },
    salary: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Saved', 'Applied', 'Online Assessment', 'Interview', 'Offer', 'Rejected'],
      default: 'Saved',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    appliedDate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    skills: {
      type: [String],
      default: [],
    },
    interview: {
      type: interviewSchema,
      default: () => ({}),
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for frequent queries
jobSchema.index({ user: 1, status: 1 });
jobSchema.index({ user: 1, createdAt: -1 });
jobSchema.index({ user: 1, appliedDate: -1 });

module.exports = mongoose.model('Job', jobSchema);
