import { describe, it, expect } from 'vitest';
import { classifyProviderError } from '../../src/providers/errors.js';

describe('classifyProviderError', () => {
  it('classifies 429 as rate_limit', () => {
    const result = classifyProviderError(new Error('Error 429: rate limit exceeded'));
    expect(result.code).toBe('rate_limit');
    expect(result.hint).toContain('retry');
  });

  it('classifies "rate limit" message as rate_limit', () => {
    const result = classifyProviderError(new Error('Rate Limit reached for groq'));
    expect(result.code).toBe('rate_limit');
  });

  it('classifies 401 as auth', () => {
    const result = classifyProviderError(new Error('401 Unauthorized: invalid api key'));
    expect(result.code).toBe('auth');
    expect(result.hint).toContain('API key');
  });

  it('classifies 402 as quota', () => {
    const result = classifyProviderError(new Error('402: insufficient_quota'));
    expect(result.code).toBe('quota');
    expect(result.hint).toContain('credits');
  });

  it('classifies "billing" as quota', () => {
    const result = classifyProviderError(new Error('Billing hard limit reached'));
    expect(result.code).toBe('quota');
  });

  it('classifies 503 as server', () => {
    const result = classifyProviderError(new Error('503 service unavailable'));
    expect(result.code).toBe('server');
    expect(result.hint).toContain('unavailable');
  });

  it('classifies ECONNREFUSED as network', () => {
    const result = classifyProviderError(new Error('ECONNREFUSED 127.0.0.1:11434'));
    expect(result.code).toBe('network');
  });

  it('returns unknown for unrecognised errors', () => {
    const result = classifyProviderError(new Error('something unexpected happened'));
    expect(result.code).toBe('unknown');
  });

  it('handles non-Error objects', () => {
    const result = classifyProviderError('string error');
    expect(result.code).toBe('unknown');
    expect(result.message).toBe('string error');
  });
});
