import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  const mockAxios = {
    post: vi.fn(),
    get: vi.fn(),
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return { default: mockAxios, ...mockAxios };
});

vi.mock('@/config/env', () => ({
  ENV: { api_url: 'https://test-api.shothik.ai' },
}));

import AuthService from '../auth.service';

const mockedPost = axios.post as Mock;
const mockedGet = axios.get as Mock;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
  });

  it('login sends correct payload', async () => {
    const mockResponse = { data: { success: true, message: 'OK', data: { token: 'abc' } }, status: 200 };
    mockedPost.mockResolvedValue(mockResponse);

    const result = await service.login('user@test.com', 'pass123', 'email');

    expect(mockedPost).toHaveBeenCalledWith(
      'https://test-api.shothik.ai/api/auth/login',
      { email: 'user@test.com', password: 'pass123', authtype: 'email' },
    );
    expect(result.data.success).toBe(true);
  });

  it('register sends correct payload', async () => {
    const mockResponse = { data: { success: true, message: 'Registered' }, status: 201 };
    mockedPost.mockResolvedValue(mockResponse);

    const result = await service.register('John', 'john@test.com', 'pass123', 'US', 'email');

    expect(mockedPost).toHaveBeenCalledWith(
      'https://test-api.shothik.ai/api/auth/register',
      { name: 'John', email: 'john@test.com', password: 'pass123', country: 'US', auth_type: 'email' },
    );
    expect(result.data.success).toBe(true);
  });

  it('googleLogin sends correct payload', async () => {
    const mockResponse = { data: { success: true, message: 'OK' }, status: 200 };
    mockedPost.mockResolvedValue(mockResponse);

    await service.googleLogin('google-code', 'US');

    expect(mockedPost).toHaveBeenCalledWith(
      'https://test-api.shothik.ai/api/auth/google-login',
      { code: 'google-code', country: 'US' },
    );
  });

  it('forgotPassword sends email', async () => {
    const mockResponse = { data: { success: true, message: 'Reset link sent' }, status: 200 };
    mockedPost.mockResolvedValue(mockResponse);

    const result = await service.forgotPassword('user@test.com');

    expect(mockedPost).toHaveBeenCalledWith(
      'https://test-api.shothik.ai/api/auth/forgot-password',
      { email: 'user@test.com' },
    );
    expect(result.data.message).toBe('Reset link sent');
  });

  it('verifyEmail sends key', async () => {
    const mockResponse = { data: { success: true, message: 'Verified' }, status: 200 };
    mockedPost.mockResolvedValue(mockResponse);

    await service.verifyEmail('verify-key-123');

    expect(mockedPost).toHaveBeenCalledWith(
      'https://test-api.shothik.ai/api/auth/verify-email/verify-key-123',
    );
  });

  it('getUser sends auth header', async () => {
    const mockResponse = { data: { success: true, data: { name: 'John' } }, status: 200 };
    mockedGet.mockResolvedValue(mockResponse);

    await service.getUser('token-abc');

    expect(mockedGet).toHaveBeenCalledWith(
      'https://test-api.shothik.ai/api/user/profile',
      { headers: { Authorization: 'Bearer token-abc' } },
    );
  });

  it('validateToken returns user data on success', async () => {
    const mockResponse = { data: { data: { name: 'John' } }, status: 200 };
    mockedGet.mockResolvedValue(mockResponse);

    const result = await service.validateToken('token-abc');
    expect(result).toEqual({ name: 'John' });
  });

  it('validateToken returns null on error', async () => {
    mockedGet.mockRejectedValue(new Error('Network error'));

    const result = await service.validateToken('bad-token');
    expect(result).toBeNull();
  });

  it('getGoogleOAuthUrl returns correct URL', () => {
    expect(service.getGoogleOAuthUrl()).toBe('https://test-api.shothik.ai/api/v2/google');
  });
});
