const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const os = require('os');
const Job = require('../models/Job');
const User = require('../models/User');

async function runBenchmark() {
  console.log('--- MongoDB Query Performance Benchmark ---');
  console.log('Machine:', `${os.type()} ${os.release()} (${os.arch()})`);
  console.log('CPU:', os.cpus()[0]?.model, `x ${os.cpus().length} cores`);
  console.log('Total Memory:', (os.totalmem() / 1024 ** 3).toFixed(2), 'GB');

  mongoose.set('strictQuery', false);
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('Connected to in-memory MongoDB instance.');

  // Create 5 users
  const users = [];
  for (let i = 0; i < 5; i++) {
    const u = new User({
      email: `bench_user_${i}@example.com`,
      password: 'password123',
      name: `User ${i}`,
    });
    await u.save();
    users.push(u._id);
  }

  const targetUserId = users[0];
  const TOTAL_DOCS = 10000;
  console.log(`Seeding ${TOTAL_DOCS} job applications across ${users.length} users...`);

  const statuses = ['Saved', 'Applied', 'Online Assessment', 'Interview', 'Offer', 'Rejected'];
  const priorities = ['Low', 'Medium', 'High'];
  const companies = [
    'Google',
    'Meta',
    'Amazon',
    'Apple',
    'Netflix',
    'Microsoft',
    'Stripe',
    'Airbnb',
  ];

  const docs = [];
  const startTime = Date.now();
  for (let i = 0; i < TOTAL_DOCS; i++) {
    const user = users[i % users.length];
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const company = companies[i % companies.length];
    docs.push({
      companyName: `${company} ${i}`,
      jobTitle: `Software Engineer ${i}`,
      status,
      priority,
      user,
      createdAt: new Date(Date.now() - i * 60000),
      appliedDate: new Date(Date.now() - i * 120000),
    });
  }

  await Job.insertMany(docs);
  console.log(`Seeded ${TOTAL_DOCS} documents in ${Date.now() - startTime} ms.`);
  console.log(
    `Target user (${targetUserId}) has ${await Job.countDocuments({ user: targetUserId })} documents.\n`
  );

  // --- WITH INDEXES ---
  await Job.syncIndexes();
  const indexes = await Job.collection.indexes();
  console.log(
    'Active indexes:',
    indexes.map((idx) => Object.keys(idx.key).join('+'))
  );

  // Benchmark Query 1: Filter by user + status
  const q1WithIdx = await Job.find({ user: targetUserId, status: 'Applied' }).explain(
    'executionStats'
  );
  const stats1With = q1WithIdx.executionStats;

  // Benchmark Query 2: Filter by user + sort by createdAt desc + limit 20
  const q2WithIdx = await Job.find({ user: targetUserId })
    .sort({ createdAt: -1 })
    .limit(20)
    .explain('executionStats');
  const stats2With = q2WithIdx.executionStats;

  // --- DROP INDEXES TO MEASURE COLLSCAN ---
  console.log('\nDropping custom compound indexes to measure COLLSCAN...');
  await Job.collection.dropIndexes();
  const remainingIndexes = await Job.collection.indexes();
  console.log(
    'Remaining indexes:',
    remainingIndexes.map((idx) => Object.keys(idx.key).join('+'))
  );

  // Benchmark Query 1 WITHOUT INDEXES
  const q1NoIdx = await Job.find({ user: targetUserId, status: 'Applied' }).explain(
    'executionStats'
  );
  const stats1No = q1NoIdx.executionStats;

  // Benchmark Query 2 WITHOUT INDEXES
  const q2NoIdx = await Job.find({ user: targetUserId })
    .sort({ createdAt: -1 })
    .limit(20)
    .explain('executionStats');
  const stats2No = q2NoIdx.executionStats;

  console.log('\n=== REAL MEASURED BENCHMARK RESULTS ===');
  console.log(
    'NOTE: Headline metric is docsExamined / keysExamined (deterministic database work).'
  );
  console.log(
    'Execution times reflect an in-memory MongoDB runner on a local machine and are subject to runtime noise.\n'
  );

  console.log('--- Query 1: Filter by user + status ({ user, status: "Applied" }) ---');
  console.log('  HEADLINE METRIC:');
  console.log(
    `    WITHOUT index: docsExamined = ${stats1No.totalDocsExamined} (COLLSCAN), keysExamined = ${stats1No.totalKeysExamined}`
  );
  console.log(
    `    WITH index:    docsExamined = ${stats1With.totalDocsExamined} (FETCH), keysExamined = ${stats1With.totalKeysExamined} (${Math.round(stats1No.totalDocsExamined / stats1With.totalDocsExamined)}x reduction)`
  );
  console.log('  Secondary (timings):');
  console.log(
    `    WITHOUT index: ${stats1No.executionTimeMillis} ms | WITH index: ${stats1With.executionTimeMillis} ms\n`
  );

  console.log('--- Query 2: Filter by user + sort by createdAt desc + limit 20 ---');
  console.log('  HEADLINE METRIC:');
  console.log(
    `    WITHOUT index: docsExamined = ${stats2No.totalDocsExamined} (SORT stage), keysExamined = ${stats2No.totalKeysExamined}`
  );
  console.log(
    `    WITH index:    docsExamined = ${stats2With.totalDocsExamined} (LIMIT stage), keysExamined = ${stats2With.totalKeysExamined} (${Math.round(stats2No.totalDocsExamined / stats2With.totalDocsExamined)}x reduction)`
  );
  console.log('  Secondary (timings):');
  console.log(
    `    WITHOUT index: ${stats2No.executionTimeMillis} ms | WITH index: ${stats2With.executionTimeMillis} ms\n`
  );

  await mongoose.disconnect();
  await mongoServer.stop();
  process.exit(0);
}

if (require.main === module) {
  runBenchmark().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = runBenchmark;
