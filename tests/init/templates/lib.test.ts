import { describe, it, expect } from 'vitest';
import * as lib from '../../../src/init/templates/lib.js';

describe('init/templates/lib', () => {
  it('packageJson includes project name', () => {
    const result = lib.packageJson('my-lib');
    const parsed = JSON.parse(result) as { name: string };
    expect(parsed.name).toBe('my-lib');
  });

  it('packageJson includes required scripts', () => {
    const result = lib.packageJson('my-lib');
    const parsed = JSON.parse(result) as { scripts: Record<string, string> };
    expect(parsed.scripts).toHaveProperty('build');
    expect(parsed.scripts).toHaveProperty('test');
  });

  it('exports all required template functions', () => {
    expect(typeof lib.packageJson).toBe('function');
    expect(typeof lib.tsconfig).toBe('function');
    expect(typeof lib.tsupConfig).toBe('function');
    expect(typeof lib.srcIndex).toBe('function');
  });
});
