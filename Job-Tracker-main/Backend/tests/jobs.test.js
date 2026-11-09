const request = require('supertest');
const app = require('../server');

describe('Health Endpoint', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBeDefined();
    expect(res.body.uptime).toBeDefined();
  });
});

describe('Jobs Endpoints', () => {
  let token;
  const testJob = {
    companyName: 'Test Company',
    jobTitle: 'Software Engineer',
    location: 'Remote',
    employmentType: 'Full Time',
    status: 'Applied',
    priority: 'High',
  };

  beforeEach(async () => {
    // Register and get token for each test
    const res = await request(app).post('/api/auth/register').send({
      email: `test${Date.now()}@example.com`,
      password: 'password123',
    });
    token = res.body.token;
  });

  it('should create a new job', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send(testJob);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.job.companyName).toBe(testJob.companyName);
    expect(res.body.job.status).toBe('Applied');
  });

  it('should validate job creation', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // missing required fields

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.some(e => e.field === 'companyName')).toBe(true);
    expect(res.body.errors.some(e => e.field === 'jobTitle')).toBe(true);
  });

  it('should get all jobs with pagination', async () => {
    // Create 2 jobs
    await request(app).post('/api/jobs').set('Authorization', `Bearer ${token}`).send(testJob);
    await request(app).post('/api/jobs').set('Authorization', `Bearer ${token}`).send(testJob);

    const res = await request(app).get('/api/jobs?page=1&limit=1').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.jobs.length).toBe(1);
    expect(res.body.total).toBe(2);
    expect(res.body.totalPages).toBe(2);
  });

  it('should update a job', async () => {
    const createRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send(testJob);
    const jobId = createRes.body.job._id;

    const res = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Interview' });

    expect(res.statusCode).toBe(200);
    expect(res.body.job.status).toBe('Interview');
  });

  it('should delete a job', async () => {
    const createRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send(testJob);
    const jobId = createRes.body.job._id;

    const res = await request(app)
      .delete(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    const getRes = await request(app).get(`/api/jobs/${jobId}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toBe(404);
  });

  it('should get job stats', async () => {
    await request(app).post('/api/jobs').set('Authorization', `Bearer ${token}`).send({ ...testJob, status: 'Applied' });
    await request(app).post('/api/jobs').set('Authorization', `Bearer ${token}`).send({ ...testJob, status: 'Interview' });
    await request(app).post('/api/jobs').set('Authorization', `Bearer ${token}`).send({ ...testJob, status: 'Interview' });

    const res = await request(app).get('/api/jobs/stats').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.stats.total).toBe(3);
    expect(res.body.stats.byStatus['Interview']).toBe(2);
    expect(res.body.stats.byStatus['Applied']).toBe(1);
  });

  it('should enforce user ownership isolation across users', async () => {
    // User A creates a job
    const createRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send(testJob);
    const userAJobId = createRes.body.job._id;

    // User B registers
    const userBRes = await request(app).post('/api/auth/register').send({
      email: `other${Date.now()}@example.com`,
      password: 'password123',
    });
    const userBToken = userBRes.body.token;

    // User B cannot get User A's job
    const getRes = await request(app)
      .get(`/api/jobs/${userAJobId}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(getRes.statusCode).toBe(404);

    // User B cannot update User A's job
    const patchRes = await request(app)
      .patch(`/api/jobs/${userAJobId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ status: 'Offer' });
    expect(patchRes.statusCode).toBe(404);

    // User B cannot delete User A's job
    const deleteRes = await request(app)
      .delete(`/api/jobs/${userAJobId}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(deleteRes.statusCode).toBe(404);

    // User B's list should not include User A's job
    const listRes = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${userBToken}`);
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.jobs.length).toBe(0);
  });
});
