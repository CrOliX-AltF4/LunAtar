import { describe, it, expect } from 'vitest';
import * as frontend from '../../../src/init/templates/frontend.js';

describe('init/templates/frontend', () => {
  it('packageJson includes project name', () => {
    const result = frontend.packageJson('my-app');
    const parsed = JSON.parse(result) as { name: string };
    expect(parsed.name).toBe('my-app');
  });

  it('packageJson includes required scripts', () => {
    const result = frontend.packageJson('my-app');
    const parsed = JSON.parse(result) as { scripts: Record<string, string> };
    expect(parsed.scripts).toHaveProperty('dev');
    expect(parsed.scripts).toHaveProperty('build');
    expect(parsed.scripts).toHaveProperty('test');
  });

  it('exports all required template functions', () => {
    expect(typeof frontend.packageJson).toBe('function');
    expect(typeof frontend.tsconfig).toBe('function');
    expect(typeof frontend.viteConfig).toBe('function');
    expect(typeof frontend.indexHtml).toBe('function');
    expect(typeof frontend.srcMain).toBe('function');
    expect(typeof frontend.srcApp).toBe('function');
    expect(typeof frontend.srcAppCss).toBe('function');
  });
});
