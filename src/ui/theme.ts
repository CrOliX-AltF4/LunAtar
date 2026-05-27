import type { PipelineStepStatus, ProviderName, AgentRole } from '../types/index.js';

// ─── Brand ────────────────────────────────────────────────────────────────────

export const BRAND_COLOR = 'yellow' as const; // Ink named color (used as prop)
export const GOLD = '#C8A415' as const; // amber/gold — active, focus
export const COPPER = '#B87333' as const; // copper/ember — borders, structure
export const BRAND_NAME = "Lun'Atar" as const;
export const BRAND_TAGLINE = 'intent → code' as const;

// ─── Spinner ──────────────────────────────────────────────────────────────────

export const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;
export const SPINNER_INTERVAL_MS = 80;

// ─── Status icons ─────────────────────────────────────────────────────────────

export const STATUS_ICONS: Record<PipelineStepStatus, string> = {
  pending: '○',
  running: '◆',
  completed: '✓',
  failed: '✗',
  skipped: '–',
};

// ─── Status colors ────────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<PipelineStepStatus, string> = {
  pending: 'gray',
  running: 'cyan',
  completed: 'green',
  failed: 'red',
  skipped: 'gray',
};

// ─── Provider colors ──────────────────────────────────────────────────────────

export const PROVIDER_COLORS: Record<ProviderName, string> = {
  openrouter: 'white',
  groq: 'cyan',
  gemini: 'blue',
  claude: 'magenta',
  openai: 'green',
  nim: 'yellow',
  ollama: 'gray',
};

// ─── Role labels ──────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<AgentRole, string> = {
  po: 'PO     ',
  planner: 'Planner',
  dev: 'Dev    ',
  qa: 'QA     ',
};

export const ROLE_TASK_LABELS: Record<AgentRole, string> = {
  po: 'Clarification',
  planner: 'Architecture',
  dev: 'Code generation',
  qa: 'Validation',
};
