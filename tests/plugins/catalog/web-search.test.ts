import { describe, it, expect } from 'vitest';
import { webSearchPlugin } from '../../../src/plugins/catalog/web-search.js';

const ctx = { outputDir: '/tmp/out', cwd: '/tmp/project' };

describe('webSearchPlugin', () => {
  it('has correct metadata', () => {
    expect(webSearchPlugin.id).toBe('web_search');
    expect(webSearchPlugin.role).toBe('all');
  });

  it('returns stub message containing the query', async () => {
    const result = await webSearchPlugin.handler({ query: 'vitest mocking' }, ctx);
    expect(result).toContain('vitest mocking');
    expect(result).toContain('web_search');
  });
});
