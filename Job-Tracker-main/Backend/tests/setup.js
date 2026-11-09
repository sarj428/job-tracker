process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret_at_least_32_characters_long_for_security';
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 60000);

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
