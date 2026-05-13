import { describe, it, expect, vi } from 'vitest';

const mockReadFile = vi.fn();
vi.mock('node:fs/promises', () => ({ readFile: mockReadFile }));

const { readFilePlugin } = await import('../../../src/plugins/catalog/read-file.js');

const ctx = { outputDir: '/tmp/out', cwd: '/tmp/project' };

describe('readFilePlugin', () => {
  it('has correct metadata', () => {
    expect(readFilePlugin.id).toBe('read_file');
    expect(readFilePlugin.role).toBe('all');
  });

  it('returns file content (truncated to 8000 chars)', async () => {
    mockReadFile.mockResolvedValue('file content');
    const result = await readFilePlugin.handler({ path: 'README.md' }, ctx);
    expect(result).toBe('file content');
  });

  it('truncates content to 8000 chars', async () => {
    mockReadFile.mockResolvedValue('x'.repeat(10000));
    const result = await readFilePlugin.handler({ path: 'big.ts' }, ctx);
    expect(result.length).toBe(8000);
  });

  it('returns error message when file not found', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    const result = await readFilePlugin.handler({ path: 'missing.ts' }, ctx);
    expect(result).toContain('Error');
    expect(result).toContain('missing.ts');
  });
});
