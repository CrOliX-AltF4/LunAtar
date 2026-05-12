import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadExternalPlugin } from '../../src/plugins/loader.js';

let tmpDir: string;

beforeAll(async () => {
  tmpDir = join(tmpdir(), `lunatar-plugin-test-${String(Date.now())}`);
  await mkdir(tmpDir, { recursive: true });

  await writeFile(
    join(tmpDir, 'valid-plugin.mjs'),
    `export const plugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      role: 'dev',
      tool: { name: 'test_tool', description: 'A test tool', inputSchema: { type: 'object', properties: {} } },
      handler: async () => 'result',
    };`,
  );

  await writeFile(
    join(tmpDir, 'invalid-plugin.mjs'),
    `export const plugin = { id: 'bad' }; // missing required fields`,
  );
});

afterAll(async () => {
  await rm(tmpDir, { recursive: true });
});

describe('loadExternalPlugin', () => {
  it('loads a valid plugin from an absolute path', async () => {
    const plugin = await loadExternalPlugin(join(tmpDir, 'valid-plugin.mjs'));
    expect(plugin.id).toBe('test-plugin');
    expect(typeof plugin.handler).toBe('function');
  });

  it('throws on invalid plugin shape', async () => {
    await expect(loadExternalPlugin(join(tmpDir, 'invalid-plugin.mjs'))).rejects.toThrow(
      /invalid plugin/i,
    );
  });

  it('throws on non-existent path', async () => {
    await expect(loadExternalPlugin(join(tmpDir, 'does-not-exist.mjs'))).rejects.toThrow();
  });
});
