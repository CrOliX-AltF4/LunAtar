import { describe, it, expect } from 'vitest';
import { githubCreateIssuePlugin } from '../../../src/plugins/catalog/github-create-issue.js';

const ctx = { outputDir: '/tmp/out', cwd: '/tmp/project' };

describe('githubCreateIssuePlugin', () => {
  it('has correct metadata', () => {
    expect(githubCreateIssuePlugin.id).toBe('github_create_issue');
    expect(githubCreateIssuePlugin.role).toBe('qa');
  });

  it('returns stub message with title and body', async () => {
    const result = await githubCreateIssuePlugin.handler(
      { title: 'Bug found', body: 'Something broke', labels: ['bug'] },
      ctx,
    );
    expect(result).toContain('Bug found');
    expect(result).toContain('bug');
  });

  it('works without labels', async () => {
    const result = await githubCreateIssuePlugin.handler({ title: 'Test', body: 'Body' }, ctx);
    expect(result).toContain('Test');
  });
});
