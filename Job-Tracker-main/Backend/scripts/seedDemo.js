const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Job = require('../models/Job');

const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@careertrack.dev';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'DemoUser123!';
const DEMO_NAME = 'Demo Candidate';

async function seedDemoData() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGO_URI environment variable is missing.');
    console.error('Please provide MONGO_URI in .env or as an environment variable.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  mongoose.set('strictQuery', false);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB database.');

  console.log(`Setting up demo account for: ${DEMO_EMAIL}`);
  let user = await User.findOne({ email: DEMO_EMAIL });

  if (user) {
    console.log('Demo user already exists. Updating password & refreshing demo applications...');
    user.password = await bcrypt.hash(DEMO_PASSWORD, 10);
    user.name = DEMO_NAME;
    await user.save();
    // Delete only this demo user's existing applications
    await Job.deleteMany({ user: user._id });
  } else {
    console.log('Creating fresh demo user...');
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    user = await User.create({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password: hashedPassword,
    });
  }

  const now = new Date();
  const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysAhead = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const sampleJobs = [
    {
      companyName: 'Linear',
      jobTitle: 'Product Engineer',
      location: 'Remote (US/EU)',
      employmentType: 'Full Time',
      status: 'Offer',
      priority: 'High',
      salary: '$165,000',
      jobUrl: 'https://linear.app/careers',
      skills: ['React', 'TypeScript', 'GraphQL', 'TailwindCSS'],
      notes:
        'Received written offer! 4-stage loop: recruiter, portfolio review, live pair-coding, founder chat.',
      appliedDate: daysAgo(28),
      interview: {
        scheduled: false,
      },
    },
    {
      companyName: 'Airbnb',
      jobTitle: 'Frontend Engineer',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: 'Full Time',
      status: 'Interview',
      priority: 'High',
      salary: '$175,000',
      jobUrl: 'https://careers.airbnb.com',
      skills: ['React', 'JavaScript', 'Design Systems', 'Web Performance'],
      notes: 'Technical screen passed. Round 3 virtual on-site scheduled next Tuesday.',
      appliedDate: daysAgo(18),
      interview: {
        scheduled: true,
        date: daysAhead(5),
        time: '14:00 PST',
        type: 'Technical',
        notes: 'System architecture review and component performance optimization.',
      },
    },
    {
      companyName: 'Datadog',
      jobTitle: 'Software Engineer - Dashboard Platform',
      location: 'New York, NY (Hybrid)',
      employmentType: 'Full Time',
      status: 'Online Assessment',
      priority: 'Medium',
      salary: '$150,000',
      jobUrl: 'https://careers.datadoghq.com',
      skills: ['TypeScript', 'React', 'Go', 'Data Visualization'],
      notes: 'Received 90-minute HackerRank assessment covering data structures and concurrency.',
      appliedDate: daysAgo(8),
      interview: {
        scheduled: false,
      },
    },
    {
      companyName: 'Figma',
      jobTitle: 'Fullstack Engineer - Collaboration',
      location: 'Remote',
      employmentType: 'Full Time',
      status: 'Applied',
      priority: 'High',
      salary: '$180,000',
      jobUrl: 'https://www.figma.com/careers',
      skills: ['TypeScript', 'C++', 'WebAssembly', 'React'],
      notes: 'Applied via employee referral from collegiate alum.',
      appliedDate: daysAgo(5),
      interview: {
        scheduled: false,
      },
    },
    {
      companyName: 'Brex',
      jobTitle: 'Backend Engineer - Financial Systems',
      location: 'Remote',
      employmentType: 'Full Time',
      status: 'Applied',
      priority: 'Medium',
      salary: '$160,000',
      jobUrl: 'https://www.brex.com/careers',
      skills: ['Node.js', 'PostgreSQL', 'Distributed Systems'],
      notes: 'Application submitted through company career portal.',
      appliedDate: daysAgo(3),
      interview: {
        scheduled: false,
      },
    },
    {
      companyName: 'Stripe',
      jobTitle: 'Software Engineer - Billing Infrastructure',
      location: 'Seattle, WA',
      employmentType: 'Full Time',
      status: 'Saved',
      priority: 'High',
      salary: '$170,000',
      jobUrl: 'https://stripe.com/jobs',
      skills: ['Ruby', 'Java', 'API Design', 'Fintech'],
      notes: 'Target role for Q2 application cycle. Tailoring resume to highlight ledger systems.',
      appliedDate: daysAgo(1),
      interview: {
        scheduled: false,
      },
    },
    {
      companyName: 'Notion',
      jobTitle: 'Frontend Engineer - Core Editor',
      location: 'San Francisco, CA',
      employmentType: 'Full Time',
      status: 'Saved',
      priority: 'Medium',
      salary: '$155,000',
      jobUrl: 'https://www.notion.so/careers',
      skills: ['React', 'Canvas', 'State Management'],
      notes: 'Preparing cover letter and reviewing recent Notion API documentation.',
      appliedDate: null,
      interview: {
        scheduled: false,
      },
    },
    {
      companyName: 'Cloudflare',
      jobTitle: 'Systems Engineer',
      location: 'Austin, TX',
      employmentType: 'Full Time',
      status: 'Rejected',
      priority: 'Low',
      salary: '$140,000',
      jobUrl: 'https://www.cloudflare.com/careers',
      skills: ['Rust', 'Networking', 'HTTP/3'],
      notes: 'Received automated rejection after initial resume screening. Revisit after 6 months.',
      appliedDate: daysAgo(45),
      interview: {
        scheduled: false,
      },
    },
  ];

  const jobsToInsert = sampleJobs.map((job) => ({
    ...job,
    user: user._id,
  }));

  const createdJobs = await Job.insertMany(jobsToInsert);
  console.log(`Successfully seeded ${createdJobs.length} sample applications!`);

  console.log('\n========================================');
  console.log('       DEMO ACCOUNT SEED COMPLETE       ');
  console.log('========================================');
  console.log(`Email:    ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);
  console.log(`Total Applications: ${createdJobs.length}`);
  console.log('Statuses populated:');
  const countByStatus = {};
  createdJobs.forEach((j) => {
    countByStatus[j.status] = (countByStatus[j.status] || 0) + 1;
  });
  Object.entries(countByStatus).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });
  console.log('========================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = seedDemoData;
