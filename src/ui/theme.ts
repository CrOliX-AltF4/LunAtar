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

// ─── Agent class labels ───────────────────────────────────────────────────────

export const AGENT_CLASS_LABELS: Record<AgentRole, string> = {
  po: 'Clerc des Exigences',
  planner: 'Mage Architecte',
  dev: 'Forgeron de Code',
  qa: 'Paladin de la Qualité',
};

export const AGENT_CLASS_SHORT: Record<AgentRole, string> = {
  po: 'Clerc    ',
  planner: 'Mage     ',
  dev: 'Forgeron ',
  qa: 'Paladin  ',
};

// ─── Flavor text ──────────────────────────────────────────────────────────────

export const AGENT_FLAVOR_TEXT: Record<AgentRole, readonly string[]> = {
  po: [
    '"Volonté du commanditaire clarifiée."',
    '"Exigences gravées dans la pierre."',
    '"Le parchemin est scellé."',
  ],
  planner: [
    '"Le plan prend forme dans les brumes."',
    '"La stratégie est révélée."',
    '"Sept chemins mènent au donjon."',
  ],
  dev: [
    '"Le marteau frappe l\'enclume une dernière fois."',
    '"Les artefacts prennent vie."',
    '"La forge s\'apaise."',
  ],
  qa: ['"La qualité est vérifiée."', '"Le paladin rend son verdict."', '"L\'artefact est pur."'],
};

// ─── Oracle messages ──────────────────────────────────────────────────────────

export const ORACLE_MESSAGES: readonly string[] = [
  '"Un forgeron patient forge deux fois."',
  '"L\'incantation juste vaut mille lignes de code."',
  '"La forge froide ne craint pas la tempête."',
  '"Qui maîtrise ses outils maîtrise le donjon."',
  '"Un parchemin bien rédigé épargne cent batailles."',
  '"L\'architecte qui doute bâtit sur du sable."',
  '"Le code non testé est une lame non aiguisée."',
];

// ─── File rarity ──────────────────────────────────────────────────────────────

export type FileRarity = 'legendary' | 'rare' | 'uncommon' | 'common';

export function getFileRarity(lineCount: number): FileRarity {
  if (lineCount >= 200) return 'legendary';
  if (lineCount >= 100) return 'rare';
  if (lineCount >= 50) return 'uncommon';
  return 'common';
}

export const RARITY_LABELS: Record<FileRarity, string> = {
  legendary: '[LÉGENDAIRE]',
  rare: '[RARE     ]',
  uncommon: '[PEU COMM.]',
  common: '[COMMUN   ]',
};

export const RARITY_COLORS: Record<FileRarity, string> = {
  legendary: GOLD,
  rare: 'magenta',
  uncommon: 'green',
  common: 'gray',
};

// ─── Forgeron level ───────────────────────────────────────────────────────────

export function forgeronLevel(runCount: number): number {
  return Math.floor(runCount / 3) + 1;
}
