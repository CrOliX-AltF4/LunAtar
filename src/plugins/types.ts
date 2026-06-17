import type { AgentRole } from '../types/index.js';
import type { ToolDefinition } from '../providers/types.js';

export type PluginTier = 'safe' | 'restricted' | 'dangerous';

export interface PluginContext {
  runId: string;
  outputDir: string;
  cwd: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  role: AgentRole | 'all';
  tier: PluginTier;
  tool: ToolDefinition;
  handler: (input: unknown, context: PluginContext) => Promise<string>;
}
