const request = require('supertest');
const app = require('../server');

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
});
