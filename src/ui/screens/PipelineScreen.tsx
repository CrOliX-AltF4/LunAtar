import React, { useState, useMemo, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import type { CompanionState } from '../components/Companion.js';
import * as orchestrator from '../../orchestrator/index.js';
import { Separator } from '../components/Separator.js';
import type { OnCompanionChange, OnStepsChange } from '../workspace/types.js';
import { StepRow } from '../components/StepRow.js';
import { Footer } from '../components/Footer.js';
import { MODEL_CATALOG } from '../../models/catalog.js';
import { buildDefaultSteps } from '../../pipeline/steps.js';
import type { PipelineRun, PipelineStep, AgentRole } from '../../types/index.js';
import type { PipelineEvent } from '../../types/events.js';
import {
  AGENT_CLASS_SHORT,
  AGENT_FLAVOR_TEXT,
  ROLE_TASK_LABELS,
  STATUS_ICONS,
  STATUS_COLORS,
  SPINNER_FRAMES,
  SPINNER_INTERVAL_MS,
  COPPER,
} from '../theme.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncateIntent(s: string): string {
  return s.length > 50 ? s.slice(0, 49) + '…' : s;
}

// ─── StepSummaryRow ───────────────────────────────────────────────────────────

function StepSummaryRow({ step }: { step: PipelineStep }) {
  const classLabel = AGENT_CLASS_SHORT[step.role].trim();
  const icon = STATUS_ICONS[step.status];
  const color = STATUS_COLORS[step.status];
  const flavors = AGENT_FLAVOR_TEXT[step.role];
  const flavor = flavors[step.id.charCodeAt(0) % flavors.length] ?? flavors[0];
  const cost = step.costUsd !== undefined ? ` · $${step.costUsd.toFixed(3)}` : '';
  const tok =
    step.tokensUsed !== undefined
      ? ` · ${step.tokensUsed >= 1000 ? `${(step.tokensUsed / 1000).toFixed(1)}k` : String(step.tokensUsed)} tok`
      : '';

  return (
    <Box flexDirection="column" gap={0}>
      <Box gap={1}>
        <Text color={color}>{icon}</Text>
        <Text color={color}>[{classLabel}]</Text>
        <Text color="white">{ROLE_TASK_LABELS[step.role]}</Text>
        <Text color="gray" dimColor>
          {cost}
          {tok}
        </Text>
      </Box>
      <Box paddingLeft={3}>
        <Text color="gray" dimColor>
          {flavor}
        </Text>
      </Box>
    </Box>
  );
}

// ─── ActiveStepPanel ──────────────────────────────────────────────────────────

function ActiveStepPanel({ step }: { step: PipelineStep }) {
  const [frame, setFrame] = useState(0);
  const classLabel = AGENT_CLASS_SHORT[step.role].trim();

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, SPINNER_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <Box borderStyle="single" borderColor="yellow" flexDirection="column" paddingX={1} marginY={0}>
      <Text color={COPPER} bold>
        [ {classLabel} ]
      </Text>
      <Box gap={1}>
        <Text color="cyan">{SPINNER_FRAMES[frame] ?? '⠋'}</Text>
        <Text color="cyan">{ROLE_TASK_LABELS[step.role]}…</Text>
      </Box>
    </Box>
  );
}

// ─── Model picker ─────────────────────────────────────────────────────────────

interface ModelPickerProps {
  role: AgentRole;
  currentModelId: string;
  onSelect: (modelId: string) => void;
  onCancel: () => void;
}

function ModelPicker({ role, currentModelId, onSelect, onCancel }: ModelPickerProps) {
  const [index, setIndex] = useState(
    Math.max(
      0,
      MODEL_CATALOG.findIndex((m) => m.id === currentModelId),
    ),
  );

  useInput((_input, key) => {
    if (key.upArrow) setIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) setIndex((i) => Math.min(MODEL_CATALOG.length - 1, i + 1));
    if (key.return) onSelect(MODEL_CATALOG[index]?.id ?? currentModelId);
    if (key.escape) onCancel();
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      marginTop={1}
      gap={1}
    >
      <Text color="cyan" bold>
        Change model — <Text color="white">{role.toUpperCase()}</Text>
      </Text>

      {MODEL_CATALOG.map((model, i) => {
        const isSelected = i === index;
        return (
          <Box key={model.id} gap={2}>
            <Text color="cyan">{isSelected ? '›' : ' '}</Text>
            <Text color={isSelected ? 'white' : 'gray'} bold={isSelected}>
              {model.displayName}
            </Text>
            <Text color="gray">[{model.provider}]</Text>
            <Text color="gray" dimColor>
              ~${(model.costPerInputToken * 1_000_000).toFixed(2)}/M tok in
            </Text>
          </Box>
        );
      })}

      <Box gap={3} marginTop={1}>
        <Text color="gray">
          <Text color="cyan">[↑↓]</Text> navigate
        </Text>
        <Text color="gray">
          <Text color="cyan">[↵]</Text> confirm
        </Text>
        <Text color="gray">
          <Text color="cyan">[Esc]</Text> cancel
        </Text>
      </Box>
    </Box>
  );
}

// ─── Pipeline screen ──────────────────────────────────────────────────────────

interface PipelineScreenProps {
  intent: string;
  skipRoles?: ReadonlySet<AgentRole>;
  onComplete?: (run: PipelineRun) => void;
  activeSkillIds?: string[];
  activePluginIds?: string[];
  onCompanionChange?: OnCompanionChange;
  onStepChange?: (current: number, total: number) => void;
  onStepsChange?: OnStepsChange;
}

const KEYBINDINGS = [
  { key: '↑↓', label: 'navigate' },
  { key: 'm', label: 'change model' },
  { key: '↵', label: 'run pipeline' },
  { key: 'q', label: 'quit' },
];

export function PipelineScreen({
  intent,
  skipRoles,
  onComplete,
  activeSkillIds,
  activePluginIds,
  onCompanionChange,
  onStepChange,
  onStepsChange,
}: PipelineScreenProps) {
  const app = useApp();
  const [steps, setSteps] = useState<PipelineStep[]>(() => buildDefaultSteps(skipRoles));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [maxIterations, setMaxIterations] = useState(2);
  const [initiative, setInitiative] = useState<number | undefined>(undefined);

  const companionState = useMemo((): CompanionState => {
    if (steps.some((s) => s.status === 'failed')) return 'error';
    if (steps.every((s) => s.status === 'completed' || s.status === 'skipped')) return 'done';
    if (isRunning) return 'forging';
    return 'idle';
  }, [steps, isRunning]);

  const companionSpeech = useMemo((): string | undefined => {
    const AGENT_SPEECH: Record<AgentRole, string> = {
      po: 'Clarifying your request...',
      planner: 'Architecting the solution...',
      dev: 'Forging the code...',
      qa: 'Validating the work...',
    };
    const running = steps.find((s) => s.status === 'running');
    if (running) return AGENT_SPEECH[running.role];
    if (steps.every((s) => s.status === 'pending')) return 'Ready. Press Enter to fire the forge.';
    if (steps.some((s) => s.status === 'failed'))
      return 'A step has failed — review the output below.';
    return undefined;
  }, [steps]);

  useEffect(() => {
    onCompanionChange?.({
      state: companionState,
      poSpeech: intent,
      ...(companionSpeech !== undefined ? { qaSpeech: companionSpeech } : {}),
    });
  }, [companionState, companionSpeech, intent]);

  useEffect(() => {
    if (isRunning) {
      onStepChange?.(currentIteration, maxIterations);
    }
  }, [currentIteration, maxIterations, isRunning]);

  useEffect(() => {
    onStepsChange?.(steps);
  }, [steps]);

  useInput((input, key) => {
    if (showPicker) return; // handled inside ModelPicker
    if (isRunning) return; // lock input while pipeline is executing

    if (input === 'q') app.exit();
    if (key.upArrow) setFocusedIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) setFocusedIndex((i) => Math.min(steps.length - 1, i + 1));
    if (input === 'm') setShowPicker(true);
    if (key.return) {
      setInitiative(Math.floor(Math.random() * 20) + 1);
      setIsRunning(true);
      const override =
        (activeSkillIds?.length ?? 0) > 0 || (activePluginIds?.length ?? 0) > 0
          ? {
              ...(activeSkillIds && activeSkillIds.length > 0 ? { skillIds: activeSkillIds } : {}),
              ...(activePluginIds && activePluginIds.length > 0
                ? { pluginIds: activePluginIds }
                : {}),
            }
          : undefined;
      void orchestrator
        .run(
          intent,
          steps,
          (updatedStep) => {
            setSteps((prev) => prev.map((s) => (s.id === updatedStep.id ? updatedStep : s)));
          },
          undefined,
          override,
          (event: PipelineEvent) => {
            if (event.type === 'iteration_started') {
              setCurrentIteration(event.iteration);
              setMaxIterations(event.maxIterations);
            }
          },
        )
        .then((run) => {
          onComplete?.(run);
        })
        .finally(() => {
          setIsRunning(false);
        });
    }
  });

  const handleModelSelect = (modelId: string) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== focusedIndex) return s;
        const model = MODEL_CATALOG.find((m) => m.id === modelId);
        return { ...s, modelId, ...(model ? { provider: model.provider } : {}) };
      }),
    );
    setShowPicker(false);
  };

  const focusedStep = steps[focusedIndex];

  return (
    <Box flexDirection="column">
      <Separator />

      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        {/* Intent */}
        <Box gap={1}>
          <Text color="gray">Pipeline:</Text>
          <Text color="white" bold>
            "{intent}"
          </Text>
        </Box>

        {/* Steps */}
        {isRunning ? (
          <Box flexDirection="column" marginTop={1} gap={1}>
            {/* Header */}
            <Box gap={2}>
              <Text color="cyan" bold>
                ◆ "{truncateIntent(intent)}"
              </Text>
              {initiative !== undefined && (
                <Text color="gray" dimColor>
                  ⚄ Init: {String(initiative)}
                </Text>
              )}
            </Box>

            {/* Steps */}
            {steps
              .filter((s) => s.status !== 'skipped')
              .map((step) => {
                if (step.status === 'completed' || step.status === 'failed') {
                  return <StepSummaryRow key={step.id} step={step} />;
                }
                if (step.status === 'running') {
                  return <ActiveStepPanel key={step.id} step={step} />;
                }
                // pending
                return (
                  <Box key={step.id} gap={1}>
                    <Text color="gray" dimColor>
                      {STATUS_ICONS[step.status]}
                    </Text>
                    <Text color="gray" dimColor>
                      [{AGENT_CLASS_SHORT[step.role].trim()}] {ROLE_TASK_LABELS[step.role]}
                    </Text>
                  </Box>
                );
              })}
          </Box>
        ) : (
          <Box flexDirection="column" marginTop={1} gap={0}>
            {steps.map((step, i) => (
              <StepRow
                key={step.id}
                step={step}
                focused={i === focusedIndex}
                stepNumber={i + 1}
                totalSteps={steps.length}
                {...(step.role === 'dev' || step.role === 'qa'
                  ? { iteration: currentIteration, maxIterations }
                  : {})}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Model picker overlay */}
      {showPicker && focusedStep && (
        <Box paddingX={1}>
          <ModelPicker
            role={focusedStep.role}
            currentModelId={focusedStep.modelId ?? ''}
            onSelect={handleModelSelect}
            onCancel={() => {
              setShowPicker(false);
            }}
          />
        </Box>
      )}

      <Footer steps={steps} keybindings={KEYBINDINGS} />
    </Box>
  );
}
