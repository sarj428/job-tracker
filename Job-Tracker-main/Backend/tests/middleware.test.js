const errorHandler = require('../middleware/errorHandler');
const auth = require('../middleware/auth');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Middleware Unit Tests', () => {
  describe('errorHandler middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        statusCode: null,
        jsonData: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.jsonData = data;
          return this;
        },
      };
      mockNext = jest.fn();
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    test('handles Mongoose ValidationError with 422 and structured error details', () => {
      const err = {
        name: 'ValidationError',
        errors: {
          email: { path: 'email', message: 'Email is required' },
          password: { path: 'password', message: 'Password is too short' },
        },
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.jsonData).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' },
          { field: 'password', message: 'Password is too short' },
        ],
      });
      expect(mockRes.jsonData.stack).toBeUndefined();
    });

    test('handles CastError (bad ObjectId) with 400', () => {
      const err = {
        name: 'CastError',
        kind: 'ObjectId',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.jsonData).toEqual({
        success: false,
        message: 'Invalid ID format',
      });
      expect(mockRes.jsonData.stack).toBeUndefined();
    });

    test('handles MongoDB duplicate key error (code 11000) with 409', () => {
      const err = {
        code: 11000,
        keyValue: { email: 'alice@example.com' },
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(409);
      expect(mockRes.jsonData).toEqual({
        success: false,
        message: 'A record with this email already exists',
      });
      expect(mockRes.jsonData.stack).toBeUndefined();
    });

    test('handles JsonWebTokenError with 401', () => {
      const err = { name: 'JsonWebTokenError' };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect(mockRes.jsonData).toEqual({
        success: false,
        message: 'Invalid authentication token',
      });
      expect(mockRes.jsonData.stack).toBeUndefined();
    });

    test('handles TokenExpiredError with 401', () => {
      const err = { name: 'TokenExpiredError' };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect(mockRes.jsonData).toEqual({
        success: false,
        message: 'Authentication token has expired',
      });
      expect(mockRes.jsonData.stack).toBeUndefined();
    });

    test('handles unknown 500 error in production with generic message and no stack trace', () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const err = new Error('Database connection credentials leaked in trace');
      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.jsonData).toEqual({
        success: false,
        message: 'An unexpected error occurred',
      });
      expect(mockRes.jsonData.stack).toBeUndefined();
      expect(mockRes.jsonData.message).not.toContain('credentials leaked');

      consoleSpy.mockRestore();
    });

    test('handles custom status code errors', () => {
      const err = {
        statusCode: 403,
        message: 'Access forbidden',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(403);
      expect(mockRes.jsonData).toEqual({
        success: false,
        message: 'Access forbidden',
      });
      expect(mockRes.jsonData.stack).toBeUndefined();
    });
  });

  describe('auth middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = {
        headers: {},
        header(name) {
          return this.headers[name] || this.headers[name.toLowerCase()];
        },
      };
      mockRes = {
        statusCode: null,
        jsonData: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.jsonData = data;
          return this;
        },
      };
      mockNext = jest.fn();
    });

    test('rejects request with missing Authorization header (401)', async () => {
      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect(mockRes.jsonData).toEqual({ success: false, message: 'Please authenticate' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('rejects request when Authorization header does not start with Bearer (401)', async () => {
      mockReq.headers['authorization'] = 'Basic dXNlcjpwYXNz';

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect(mockRes.jsonData).toEqual({ success: false, message: 'Please authenticate' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('rejects request with malformed or invalid JWT token (401)', async () => {
      mockReq.headers['authorization'] = 'Bearer invalid.token.payload';

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect(mockRes.jsonData).toEqual({ success: false, message: 'Please authenticate' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('rejects request with expired JWT token with specific expired message (401)', async () => {
      const expiredToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011' },
        process.env.JWT_SECRET || 'test-jwt-secret-min-32-chars-long-example',
        { expiresIn: '-1s' }
      );
      mockReq.headers['authorization'] = `Bearer ${expiredToken}`;

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect(mockRes.jsonData).toEqual({
        success: false,
        message: 'Session expired, please log in again',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('rejects request when decoded user is not found in database (401)', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';
      const validToken = jwt.sign(
        { userId: nonExistentUserId },
        process.env.JWT_SECRET || 'test-jwt-secret-min-32-chars-long-example',
        { expiresIn: '1h' }
      );
      mockReq.headers['authorization'] = `Bearer ${validToken}`;

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect(mockRes.jsonData).toEqual({ success: false, message: 'Please authenticate' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('authenticates successfully and attaches user and token to req', async () => {
      const user = await User.create({
        name: 'Auth Test User',
        email: 'authtest@example.com',
        password: 'Password123!',
      });

      const validToken = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET || 'test-jwt-secret-min-32-chars-long-example',
        { expiresIn: '1h' }
      );
      mockReq.headers['authorization'] = `Bearer ${validToken}`;

      await auth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(user._id.toString());
      expect(mockReq.token).toBe(validToken);
    });
  });
});
