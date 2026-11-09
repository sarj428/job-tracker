module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 60000,
  silent: true,
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!scripts/**',
    '!jest.config.js',
    '!tests/**',
  ],
};
