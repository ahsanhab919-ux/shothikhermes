/**
 * Test setup file
 * Runs before each test file
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import * as React from 'react';

// Next 15/16 + React 19 test environment hack
// Forces vitest/jsdom to properly resolve React hooks instead of
// failing with "Invalid hook call" when running multiple test files
globalThis.React = React;

// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock';
process.env.CLERK_SECRET_KEY = 'sk_test_mock';
process.env.KIMI_API_KEY = 'mock-kimi-key';

// Mock fetch globally
global.fetch = vi.fn();

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
global.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
