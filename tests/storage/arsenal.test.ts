import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fs/promises so tests don't touch disk
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('node:os', () => ({ homedir: () => '/home/test' }));
// Use POSIX path on all platforms so expected paths are forward-slash
vi.mock('node:path', async () => {
  const posix = await import('node:path/posix');
  return { ...posix, default: posix };
});

const { readFile, writeFile } = await import('node:fs/promises');
const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);

const { loadArsenal, saveArsenal } = await import('../../src/storage/arsenal.js');

describe('loadArsenal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty arrays when file does not exist', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const result = await loadArsenal();
    expect(result).toEqual({ skillIds: [], pluginIds: [] });
  });

  it('returns parsed content when file exists', async () => {
    const stored = { skillIds: ['typescript-strict'], pluginIds: ['web-search'] };
    mockReadFile.mockResolvedValue(JSON.stringify(stored));
    const result = await loadArsenal();
    expect(result).toEqual(stored);
  });

  it('returns empty arrays when file contains invalid JSON', async () => {
    mockReadFile.mockResolvedValue('not-json');
    const result = await loadArsenal();
    expect(result).toEqual({ skillIds: [], pluginIds: [] });
  });
});

describe('saveArsenal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes JSON to ~/.lunira/arsenal.json', async () => {
    const config = { skillIds: ['security'], pluginIds: [] };
    await saveArsenal(config);
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/home/test/.lunira/arsenal.json',
      JSON.stringify(config, null, 2),
      'utf-8',
    );
  });
});
