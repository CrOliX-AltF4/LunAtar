import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectConfig } from './types.js';

export const defaultConfig: ProjectConfig = {
  skills: {},
  plugins: {},
};

export async function loadProjectConfig(cwd: string): Promise<ProjectConfig> {
  const configPath = join(cwd, 'aiwb.config.json');
  try {
    const raw = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<ProjectConfig>;
    return {
      skills: parsed.skills ?? {},
      plugins: parsed.plugins ?? {},
      ...(parsed.models ? { models: parsed.models } : {}),
    };
  } catch {
    return defaultConfig;
  }
}
