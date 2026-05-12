import { describe, it, expect } from 'vitest';
import { isRetriableError } from '../../src/pipeline/errors.js';

describe('isRetriableError', () => {
  it('returns true for rate limit errors (HTTP 429)', () => {
    expect(isRetriableError(new Error('rate limit exceeded'))).toBe(true);
  });

  it('returns true for network timeout errors', () => {
    expect(isRetriableError(new Error('network timeout'))).toBe(true);
  });

  it('returns true for connection refused', () => {
    expect(isRetriableError(new Error('ECONNREFUSED'))).toBe(true);
  });

  it('returns false for auth errors (HTTP 401)', () => {
    expect(isRetriableError(new Error('401 unauthorized'))).toBe(false);
  });

  it('returns false for invalid request errors (HTTP 400)', () => {
    expect(isRetriableError(new Error('400 bad request'))).toBe(false);
  });

  it('returns false for unknown errors', () => {
    expect(isRetriableError(new Error('something unexpected happened'))).toBe(false);
  });
});
