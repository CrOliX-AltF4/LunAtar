import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';

const mockMkdir = vi.fn().mockResolvedValue(undefined);
const mockWriteFile = vi.fn().mockResolvedValue(undefined);

vi.mock('node:fs/promises', () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
}));

const { fileWritePlugin } = await import('../../../src/plugins/catalog/file-write.js');

const ctx = { outputDir: '/tmp/out', cwd: '/tmp/project' };

// Build expected path fragment using the platform separator so tests pass on
// both POSIX and Windows (node:path join uses the OS-native separator).
function platformPath(...parts: string[]): string {
  return join(...parts);
}

describe('fileWritePlugin', () => {
  beforeEach(() => {
    mockMkdir.mockClear();
    mockWriteFile.mockClear();
  });

  it('has correct metadata', () => {
    expect(fileWritePlugin.id).toBe('file_write');
    expect(fileWritePlugin.role).toBe('dev');
  });

  it('writes file to outputDir and returns path', async () => {
    const result = await fileWritePlugin.handler(
      { path: 'src/index.ts', content: 'export {}' },
      ctx,
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      platformPath(ctx.outputDir, 'src/index.ts'),
      'export {}',
      'utf-8',
    );
    expect(result).toBe('Written: src/index.ts');
  });

  it('creates parent directories', async () => {
    await fileWritePlugin.handler({ path: 'deep/nested/file.ts', content: '' }, ctx);
    expect(mockMkdir).toHaveBeenCalledWith(platformPath(ctx.outputDir, 'deep/nested'), {
      recursive: true,
    });
  });
});
