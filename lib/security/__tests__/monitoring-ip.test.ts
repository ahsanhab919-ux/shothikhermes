import { describe, expect, it } from 'vitest';
import { getRequestIp } from '../monitoring';

describe('getRequestIp', () => {
  it('uses first x-forwarded-for value when present', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getRequestIp({ headers })).toBe('1.2.3.4');
  });

  it('falls back to request.ip and then unknown', () => {
    expect(getRequestIp({ headers: new Headers(), ip: '9.9.9.9' })).toBe('9.9.9.9');
    expect(getRequestIp({ headers: new Headers() })).toBe('unknown');
  });
});
