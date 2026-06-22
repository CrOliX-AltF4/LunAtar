import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const LUNIRA_DIR = join(homedir(), '.lunira');
const ARSENAL_PATH = join(LUNIRA_DIR, 'arsenal.json');

export interface ArsenalConfig {
  skillIds: string[];
  pluginIds: string[];
}

export async function loadArsenal(): Promise<ArsenalConfig> {
  try {
    const raw = await readFile(ARSENAL_PATH, 'utf-8');
    return JSON.parse(raw) as ArsenalConfig;
  } catch {
    return { skillIds: [], pluginIds: [] };
  }
}

export async function saveArsenal(config: ArsenalConfig): Promise<void> {
  await mkdir(LUNIRA_DIR, { recursive: true });
  await writeFile(ARSENAL_PATH, JSON.stringify(config, null, 2), 'utf-8');
}
