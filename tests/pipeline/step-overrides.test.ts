import { describe, it, expect } from 'vitest';
import { buildDefaultSteps, applyStepOverrides } from '../../src/pipeline/steps.js';

describe('applyStepOverrides', () => {
  it('overrides modelId on all non-skipped steps', () => {
    const steps = buildDefaultSteps();
    const result = applyStepOverrides(steps, { modelId: 'gpt-4o' });
    for (const step of result) {
      expect(step.modelId).toBe('gpt-4o');
    }
  });

  it('overrides provider on all non-skipped steps', () => {
    const steps = buildDefaultSteps();
    const result = applyStepOverrides(steps, { providerName: 'openai' });
    for (const step of result) {
      expect(step.provider).toBe('openai');
    }
  });

  it('does not override skipped steps', () => {
    const steps = buildDefaultSteps(new Set(['po']));
    const result = applyStepOverrides(steps, { modelId: 'gpt-4o', providerName: 'openai' });
    const poStep = result.find((s) => s.role === 'po');
    expect(poStep?.status).toBe('skipped');
    expect(poStep?.modelId).not.toBe('gpt-4o');
  });

  it('returns a new array and does not mutate input', () => {
    const steps = buildDefaultSteps();
    const originalModelId = steps[0]?.modelId;
    const result = applyStepOverrides(steps, { modelId: 'gpt-4o' });
    expect(steps[0]?.modelId).toBe(originalModelId);
    expect(result[0]?.modelId).toBe('gpt-4o');
  });

  it('applies both modelId and provider together', () => {
    const steps = buildDefaultSteps();
    const result = applyStepOverrides(steps, { modelId: 'gemini-2.5-pro', providerName: 'gemini' });
    for (const step of result.filter((s) => s.status !== 'skipped')) {
      expect(step.modelId).toBe('gemini-2.5-pro');
      expect(step.provider).toBe('gemini');
    }
  });

  it('is a no-op when called with no overrides', () => {
    const steps = buildDefaultSteps();
    const result = applyStepOverrides(steps, {});
    expect(result.map((s) => s.modelId)).toEqual(steps.map((s) => s.modelId));
  });
});
