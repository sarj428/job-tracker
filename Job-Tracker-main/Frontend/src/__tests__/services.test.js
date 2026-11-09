import Cookies from 'js-cookie';
import { getAllJobs, createJob, updateJob, deleteJob, getJobStats } from '../services/jobService';
import { setAuthCookie, clearAuthCookie, getAuthCookie } from '../services/authService';

jest.mock('js-cookie');

describe('Frontend Services', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('jobService error and auth handling', () => {
    test('dispatches auth:logout custom event and throws on 401 response', async () => {
      Cookies.get.mockReturnValue('mock-token');

      global.fetch = jest.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ success: false, message: 'Session expired' }),
      });

      const logoutListener = jest.fn();
      window.addEventListener('auth:logout', logoutListener);

      await expect(getAllJobs()).rejects.toThrow('Session expired');
      expect(logoutListener).toHaveBeenCalledTimes(1);

      window.removeEventListener('auth:logout', logoutListener);
    });

    test('sends Authorization Bearer header and credentials:include on job requests', async () => {
      Cookies.get.mockReturnValue('valid-jwt-token');

      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ success: true, jobs: [], total: 0 }),
      });

      const res = await getAllJobs({ status: 'Interview', search: 'Google' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs?status=Interview&search=Google'),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
          },
          credentials: 'include',
        })
      );
      expect(res.success).toBe(true);
    });

    test('createJob sends POST request with JSON body', async () => {
      Cookies.get.mockReturnValue('valid-jwt-token');
      const newJob = { companyName: 'Stripe', jobTitle: 'SRE' };

      global.fetch = jest.fn().mockResolvedValue({
        status: 201,
        ok: true,
        json: async () => ({ success: true, job: { _id: '1', ...newJob } }),
      });

      const res = await createJob(newJob);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newJob),
          credentials: 'include',
        })
      );
      expect(res.job.companyName).toBe('Stripe');
    });

    test('updateJob sends PATCH request with JSON body', async () => {
      Cookies.get.mockReturnValue('valid-jwt-token');

      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ success: true, job: { _id: '1', status: 'Offer' } }),
      });

      const res = await updateJob('1', { status: 'Offer' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'Offer' }),
        })
      );
      expect(res.job.status).toBe('Offer');
    });

    test('deleteJob sends DELETE request', async () => {
      Cookies.get.mockReturnValue('valid-jwt-token');

      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ success: true, message: 'Deleted' }),
      });

      const res = await deleteJob('1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(res.success).toBe(true);
    });

    test('getJobStats sends GET request to /jobs/stats', async () => {
      Cookies.get.mockReturnValue('valid-jwt-token');

      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ success: true, stats: { total: 5 } }),
      });

      const res = await getJobStats();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/stats'),
        expect.objectContaining({ credentials: 'include' })
      );
      expect(res.stats.total).toBe(5);
    });
  });

  describe('authService cookie flags and storage', () => {
    test('setAuthCookie and clearAuthCookie set cookie flags appropriately', () => {
      const mockUser = { id: 'u1', name: 'Dev User', email: 'dev@test.com' };

      setAuthCookie('jwt-token-xyz', mockUser);

      expect(Cookies.set).toHaveBeenCalledWith(
        'ct_token',
        'jwt-token-xyz',
        expect.objectContaining({
          expires: 7,
          sameSite: expect.any(String),
          secure: expect.any(Boolean),
        })
      );

      expect(Cookies.set).toHaveBeenCalledWith(
        'ct_user',
        JSON.stringify(mockUser),
        expect.objectContaining({
          expires: 7,
          sameSite: expect.any(String),
          secure: expect.any(Boolean),
        })
      );

      clearAuthCookie();
      expect(Cookies.remove).toHaveBeenCalledWith(
        'ct_token',
        expect.objectContaining({
          sameSite: expect.any(String),
          secure: expect.any(Boolean),
        })
      );
      expect(Cookies.remove).toHaveBeenCalledWith(
        'ct_user',
        expect.objectContaining({
          sameSite: expect.any(String),
          secure: expect.any(Boolean),
        })
      );
    });

    test('getAuthCookie parses stored token and JSON user object safely', () => {
      Cookies.get.mockImplementation((key) => {
        if (key === 'ct_token') return 'token-123';
        if (key === 'ct_user') return JSON.stringify({ id: 'u1', name: 'Dev User' });
        return null;
      });

      const authData = getAuthCookie();
      expect(authData.token).toBe('token-123');
      expect(authData.user).toEqual({ id: 'u1', name: 'Dev User' });
    });

    test('getAuthCookie returns null user if JSON parsing fails', () => {
      Cookies.get.mockImplementation((key) => {
        if (key === 'ct_token') return 'token-123';
        if (key === 'ct_user') return 'invalid-json{{{';
        return null;
      });

      const authData = getAuthCookie();
      expect(authData.token).toBe('token-123');
      expect(authData.user).toBeNull();
    });
  });
});
