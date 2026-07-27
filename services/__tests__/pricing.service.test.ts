import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('@/lib/api-payment', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    create: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import {
  fetchPublicPlans,
  fetchPublicPackages,
  fetchPublicPackage,
  fetchPublicPaymentMethods,
  fetchPublicPaymentMethod,
  initiatePayment,
  verifyPayment,
  fetchPaymentTransactionStatus,
} from '../pricing.service';

describe('pricing.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPublicPlans', () => {
    it('fetches plans', async () => {
      const mockData = { plans: [{ id: '1', name: 'Free' }] };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await fetchPublicPlans();
      expect(mockGet).toHaveBeenCalledWith('/api/plans/public', { params: undefined });
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchPublicPackages', () => {
    it('fetches packages', async () => {
      const mockData = { packages: [{ id: '1', name: 'Basic' }] };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await fetchPublicPackages();
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchPublicPackage', () => {
    it('fetches a single package by ID', async () => {
      const mockData = { id: '1', name: 'Basic' };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await fetchPublicPackage('1');
      expect(mockGet).toHaveBeenCalledWith('/api/packages/public/1');
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchPublicPaymentMethods', () => {
    it('fetches payment methods', async () => {
      const mockData = { methods: [{ id: '1', name: 'Card' }] };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await fetchPublicPaymentMethods();
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchPublicPaymentMethod', () => {
    it('fetches a single payment method', async () => {
      const mockData = { id: '1', name: 'Card' };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await fetchPublicPaymentMethod('1');
      expect(result).toEqual(mockData);
    });
  });

  describe('initiatePayment', () => {
    it('sends payment initiation request', async () => {
      const mockData = { transactionId: 'txn-1', redirectUrl: 'https://pay.example.com' };
      mockPost.mockResolvedValue({ data: mockData });

      const payload = {
        package: 'pkg-1',
        plan: 'plan-1',
        payment_method: 'card',
        return_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      };

      const result = await initiatePayment(payload);
      expect(mockPost).toHaveBeenCalledWith('/api/payment-transactions/initiate', payload);
      expect(result).toEqual(mockData);
    });
  });

  describe('verifyPayment', () => {
    it('verifies a payment', async () => {
      const mockData = { status: 'completed' };
      mockPost.mockResolvedValue({ data: mockData });

      const result = await verifyPayment('txn-1');
      expect(mockPost).toHaveBeenCalledWith('/api/payment-transactions/txn-1/verify');
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchPaymentTransactionStatus', () => {
    it('fetches transaction status', async () => {
      const mockData = { data: { status: 'pending' } };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await fetchPaymentTransactionStatus('txn-1');
      expect(result.data).toEqual({ status: 'pending' });
    });
  });
});
