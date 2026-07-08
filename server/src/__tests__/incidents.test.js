const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Incident = require('../models/Incident');
const TimelineEntry = require('../models/TimelineEntry');
const User = require('../models/User');

// Configure test db URI before tests
beforeAll(async () => {
  // If mongoose is already connected, disconnect it first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  const testUri = 'mongodb://localhost:27017/incident-command-test';
  await mongoose.connect(testUri);
});

afterAll(async () => {
  // Clean up collections
  await User.deleteMany({});
  await Incident.deleteMany({});
  await TimelineEntry.deleteMany({});
  await mongoose.disconnect();
});

describe('Incident Management & Postmortem Integration Tests', () => {
  let token;
  let user;
  let incidentId;

  // Create a user to get auth token
  beforeEach(async () => {
    // Clean up collections before each test for isolation
    await User.deleteMany({});
    await Incident.deleteMany({});
    await TimelineEntry.deleteMany({});

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Responder',
        email: 'responder@test.com',
        password: 'Password123!',
        role: 'responder',
      });

    token = registerRes.body.token;
    user = registerRes.body.user;
  });

  test('Happy Path: Create, Add Update, Resolve (Generate Postmortem), and Edit Postmortem', async () => {
    // A. Create Incident
    const createRes = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'API Gateway CPU Spike',
        severity: 'SEV1',
        description: 'CPU usage is at 100% on the API gateway service.',
        affectedServices: ['API Gateway', 'Auth Service'],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.incident).toBeDefined();
    expect(createRes.body.incident.title).toBe('API Gateway CPU Spike');
    expect(createRes.body.incident.status).toBe('Investigating');
    incidentId = createRes.body.incident._id;

    // B. Add Timeline Entry
    const timelineRes = await request(app)
      .post(`/api/incidents/${incidentId}/timeline`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Checked gateway logs: seeing high rate of 5xx errors from Auth Service.',
      });

    expect(timelineRes.status).toBe(201);
    expect(timelineRes.body.entry).toBeDefined();
    expect(timelineRes.body.entry.text).toContain('Checked gateway logs');

    // C. Resolve Incident (Status changed to Resolved should compile and generate postmortem)
    const resolveRes = await request(app)
      .patch(`/api/incidents/${incidentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'Resolved',
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.incident.status).toBe('Resolved');
    expect(resolveRes.body.incident.postmortem).toBeDefined();
    expect(resolveRes.body.incident.postmortem.content).toContain('# Postmortem: API Gateway CPU Spike');
    expect(resolveRes.body.incident.postmortem.content).toContain('Checked gateway logs');

    // D. Edit Postmortem content
    const updatedPostmortemContent = resolveRes.body.incident.postmortem.content + '\n## Lessons Learned\n- Always scale gateway instances based on traffic volume.';
    const editRes = await request(app)
      .patch(`/api/incidents/${incidentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        postmortem: updatedPostmortemContent,
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.incident.postmortem.content).toBe(updatedPostmortemContent);
  });
});
