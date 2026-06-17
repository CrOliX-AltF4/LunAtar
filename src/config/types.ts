import type { AgentRole } from '../types/index.js';

export interface SkillsConfig extends Partial<Record<AgentRole | 'all', string[]>> {
  external?: string[];
}

export interface PluginsConfig extends Partial<Record<AgentRole | 'all', string[]>> {
  external?: string[];
}

export interface ProvidersConfig {
  fallback?: string[];
}

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  role?: AgentRole | 'all';
}

export interface ProjectConfig {
  skills: SkillsConfig;
  plugins: PluginsConfig;
  models?: Partial<Record<AgentRole, string>>;
  providers?: ProvidersConfig;
  mcpServers?: Record<string, McpServerConfig>;
}
