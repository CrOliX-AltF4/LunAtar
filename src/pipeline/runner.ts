import { randomUUID } from 'node:crypto';
import { getProvider } from '../providers/registry.js';
import { runPOAgent, runPlannerAgent, runDevAgent, runQAAgent } from '../agents/index.js';
import type { PipelineRun, PipelineStep, AgentRole } from '../types/index.js';
import type { POOutput, PlannerOutput, DevOutput, QAOutput } from '../agents/types.js';
import { buildPlannerInput, buildDevInput, buildQAInput } from './mapper.js';
import { loadProjectConfig } from '../config/project.js';
import { SkillRegistry } from '../skills/registry.js';
import { PluginRegistry } from '../plugins/registry.js';
import type { Skill } from '../skills/types.js';
import type { Plugin } from '../plugins/types.js';

// ─── Pipeline preload ─────────────────────────────────────────────────────────
// Allows callers to inject agent outputs before the pipeline runs.
// Used by --from-po: Natsume acts as PO and passes its output directly.

export interface PipelinePreload {
  /** Pre-computed PO output. Combined with --skip po to bypass the PO agent. */
  po?: POOutput;
}

// ─── Internal pipeline context ────────────────────────────────────────────────
// Carries typed agent outputs across steps without exposing them to other layers.

interface PipelineContext {
  po?: POOutput;
  planner?: PlannerOutput;
  dev?: DevOutput;
  qa?: QAOutput;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

/**
 * Executes the PO → Planner → Dev → QA pipeline sequentially.
 * Steps pre-marked as `skipped` (via buildDefaultSteps) are bypassed without
 * making any LLM call. Their status is preserved and reported via onUpdate.
 *
 * @param intent   Raw user intent string.
 * @param steps    Step configuration — roles pre-marked `skipped` are bypassed.
 * @param onUpdate Called after every step status change for live TUI updates.
 */
export async function runPipeline(
  intent: string,
  steps: PipelineStep[],
  onUpdate?: (step: PipelineStep) => void,
  preload?: PipelinePreload,
): Promise<PipelineRun> {
  const run: PipelineRun = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    intent,
    // Preserve `skipped` status from input; reset everything else to `pending`.
    steps: steps.map((s) => ({ ...s, status: s.status === 'skipped' ? 'skipped' : 'pending' })),
    totalCostUsd: 0,
    totalTokens: 0,
    totalDurationMs: 0,
    status: 'running',
  };

  // Seed context with any pre-loaded outputs (e.g. --from-po).
  const ctx: PipelineContext = { ...(preload?.po ? { po: preload.po } : {}) };
  const wallStart = Date.now();

  const projectConfig = await loadProjectConfig(process.cwd());
  const skillRegistry = new SkillRegistry();
  const pluginRegistry = new PluginRegistry();

  const getActiveSkills = (role: AgentRole): Skill[] => {
    const ids = [...(projectConfig.skills.all ?? []), ...(projectConfig.skills[role] ?? [])];
    return ids.map((id) => skillRegistry.getById(id)).filter((s): s is Skill => s !== undefined);
  };

  const getActivePlugins = (role: AgentRole): Plugin[] => {
    const ids = [...(projectConfig.plugins.all ?? []), ...(projectConfig.plugins[role] ?? [])];
    return ids.map((id) => pluginRegistry.getById(id)).filter((p): p is Plugin => p !== undefined);
  };

  const patch = (index: number, changes: Partial<PipelineStep>): void => {
    const current = run.steps[index];
    if (!current) return;
    const updated = { ...current, ...changes };
    run.steps[index] = updated;
    onUpdate?.(updated);
  };

  for (let i = 0; i < run.steps.length; i++) {
    const step = run.steps[i];
    if (!step) continue;

    // Steps pre-marked as skipped are bypassed — notify and move on.
    if (step.status === 'skipped') {
      onUpdate?.(step);
      continue;
    }

    const providerName = step.provider ?? 'groq';
    const modelId = step.modelId ?? '';

    const provider = getProvider(providerName);

    if (!provider.isConfigured()) {
      patch(i, {
        status: 'failed',
        error: `Provider "${providerName}" is not configured (missing API key).`,
      });
      skipRemaining(run, i + 1, patch);
      run.status = 'failed';
      break;
    }

    patch(i, { status: 'running' });

    try {
      switch (step.role) {
        case 'po': {
          const { output, meta } = await runPOAgent(
            { intent },
            {
              provider,
              modelId,
              ...(getActiveSkills('po').length > 0 ? { skills: getActiveSkills('po') } : {}),
              ...(getActivePlugins('po').length > 0 ? { plugins: getActivePlugins('po') } : {}),
            },
          );
          ctx.po = output;
          patch(i, applyMeta('completed', output, meta));
          break;
        }

        case 'planner': {
          if (!ctx.po) throw new Error('PO output is missing — cannot run Planner.');
          const { output, meta } = await runPlannerAgent(buildPlannerInput(ctx.po), {
            provider,
            modelId,
            ...(getActiveSkills('planner').length > 0
              ? { skills: getActiveSkills('planner') }
              : {}),
            ...(getActivePlugins('planner').length > 0
              ? { plugins: getActivePlugins('planner') }
              : {}),
          });
          ctx.planner = output;
          patch(i, applyMeta('completed', output, meta));
          break;
        }

        case 'dev': {
          if (!ctx.po) throw new Error('PO output is missing — cannot run Dev.');
          if (!ctx.planner) throw new Error('Planner output is missing — cannot run Dev.');
          const { output, meta } = await runDevAgent(buildDevInput(ctx.po, ctx.planner), {
            provider,
            modelId,
            ...(getActiveSkills('dev').length > 0 ? { skills: getActiveSkills('dev') } : {}),
            ...(getActivePlugins('dev').length > 0 ? { plugins: getActivePlugins('dev') } : {}),
          });
          ctx.dev = output;
          patch(i, applyMeta('completed', output, meta));
          break;
        }

        case 'qa': {
          if (!ctx.po) throw new Error('PO output is missing — cannot run QA.');
          if (!ctx.dev) throw new Error('Dev output is missing — cannot run QA.');
          const { output, meta } = await runQAAgent(buildQAInput(ctx.po, ctx.dev), {
            provider,
            modelId,
            ...(getActiveSkills('qa').length > 0 ? { skills: getActiveSkills('qa') } : {}),
            ...(getActivePlugins('qa').length > 0 ? { plugins: getActivePlugins('qa') } : {}),
          });
          ctx.qa = output;
          patch(i, applyMeta('completed', output, meta));
          break;
        }
      }
    } catch (err) {
      patch(i, { status: 'failed', error: String(err) });
      skipRemaining(run, i + 1, patch);
      run.status = 'failed';
      break;
    }
  }

  run.totalCostUsd = run.steps.reduce((sum, s) => sum + (s.costUsd ?? 0), 0);
  run.totalTokens = run.steps.reduce((sum, s) => sum + (s.tokensUsed ?? 0), 0);
  run.totalDurationMs = Date.now() - wallStart;

  if (run.status === 'running') run.status = 'completed';

  return run;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyMeta(
  status: 'completed',
  output: unknown,
  meta: { inputTokens: number; outputTokens: number; costUsd: number; durationMs: number },
): Partial<PipelineStep> {
  return {
    status,
    output: JSON.stringify(output),
    tokensUsed: meta.inputTokens + meta.outputTokens,
    costUsd: meta.costUsd,
    durationMs: meta.durationMs,
  };
}

function skipRemaining(
  run: PipelineRun,
  fromIndex: number,
  patch: (i: number, changes: Partial<PipelineStep>) => void,
): void {
  for (let j = fromIndex; j < run.steps.length; j++) {
    patch(j, { status: 'skipped' });
  }
}
