const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const os = require('os');
const Job = require('../models/Job');
const User = require('../models/User');

async function runBenchmark() {
  console.log('--- MongoDB Query Performance Benchmark ---');
  console.log('Machine:', `${os.type()} ${os.release()} (${os.arch()})`);
  console.log('CPU:', os.cpus()[0]?.model, `x ${os.cpus().length} cores`);
  console.log('Total Memory:', (os.totalmem() / (1024 ** 3)).toFixed(2), 'GB');

  mongoose.set('strictQuery', false);
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('Connected to in-memory MongoDB instance.');

  // Create 5 users
  const users = [];
  for (let i = 0; i < 5; i++) {
    const u = new User({ email: `bench_user_${i}@example.com`, password: 'password123', name: `User ${i}` });
    await u.save();
    users.push(u._id);
  }

  const targetUserId = users[0];
  const TOTAL_DOCS = 10000;
  console.log(`Seeding ${TOTAL_DOCS} job applications across ${users.length} users...`);

  const statuses = ['Saved', 'Applied', 'Online Assessment', 'Interview', 'Offer', 'Rejected'];
  const priorities = ['Low', 'Medium', 'High'];
  const companies = ['Google', 'Meta', 'Amazon', 'Apple', 'Netflix', 'Microsoft', 'Stripe', 'Airbnb'];

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
      createdAt: new Date(Date.now() - (i * 60000)),
      appliedDate: new Date(Date.now() - (i * 120000)),
    });
  }

  await Job.insertMany(docs);
  console.log(`Seeded ${TOTAL_DOCS} documents in ${Date.now() - startTime} ms.`);
  console.log(`Target user (${targetUserId}) has ${await Job.countDocuments({ user: targetUserId })} documents.\n`);

  // --- WITH INDEXES ---
  await Job.syncIndexes();
  const indexes = await Job.collection.indexes();
  console.log('Active indexes:', indexes.map(idx => Object.keys(idx.key).join('+')));

  // Benchmark Query 1: Filter by user + status
  const q1WithIdx = await Job.find({ user: targetUserId, status: 'Applied' })
    .explain('executionStats');
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
  console.log('Remaining indexes:', remainingIndexes.map(idx => Object.keys(idx.key).join('+')));

  // Benchmark Query 1 WITHOUT INDEXES
  const q1NoIdx = await Job.find({ user: targetUserId, status: 'Applied' })
    .explain('executionStats');
  const stats1No = q1NoIdx.executionStats;

  // Benchmark Query 2 WITHOUT INDEXES
  const q2NoIdx = await Job.find({ user: targetUserId })
    .sort({ createdAt: -1 })
    .limit(20)
    .explain('executionStats');
  const stats2No = q2NoIdx.executionStats;

  console.log('\n=== REAL MEASURED BENCHMARK RESULTS ===\n');

  console.log('--- Query 1: { user, status: "Applied" } ---');
  console.log('WITHOUT index:');
  console.log(`  Stage:            ${stats1No.executionStages.stage}`);
  console.log(`  nReturned:        ${stats1No.nReturned}`);
  console.log(`  docsExamined:     ${stats1No.totalDocsExamined}`);
  console.log(`  keysExamined:     ${stats1No.totalKeysExamined}`);
  console.log(`  executionTimeMs:  ${stats1No.executionTimeMillis} ms`);

  console.log('WITH compound index { user: 1, status: 1 }:');
  console.log(`  Stage:            ${stats1With.executionStages.stage}`);
  console.log(`  nReturned:        ${stats1With.nReturned}`);
  console.log(`  docsExamined:     ${stats1With.totalDocsExamined}`);
  console.log(`  keysExamined:     ${stats1With.totalKeysExamined}`);
  console.log(`  executionTimeMs:  ${stats1With.executionTimeMillis} ms`);

  console.log('\n--- Query 2: { user } sort { createdAt: -1 } limit 20 ---');
  console.log('WITHOUT index:');
  console.log(`  Stage:            ${stats2No.executionStages.stage}`);
  console.log(`  nReturned:        ${stats2No.nReturned}`);
  console.log(`  docsExamined:     ${stats2No.totalDocsExamined}`);
  console.log(`  keysExamined:     ${stats2No.totalKeysExamined}`);
  console.log(`  executionTimeMs:  ${stats2No.executionTimeMillis} ms`);

  console.log('WITH compound index { user: 1, createdAt: -1 }:');
  console.log(`  Stage:            ${stats2With.executionStages.stage}`);
  console.log(`  nReturned:        ${stats2With.nReturned}`);
  console.log(`  docsExamined:     ${stats2With.totalDocsExamined}`);
  console.log(`  keysExamined:     ${stats2With.totalKeysExamined}`);
  console.log(`  executionTimeMs:  ${stats2With.executionTimeMillis} ms`);

  await mongoose.disconnect();
  await mongoServer.stop();
  process.exit(0);
}

if (require.main === module) {
  runBenchmark().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = runBenchmark;
