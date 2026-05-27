import React, { useState, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import type { CompanionState } from '../components/Companion.js';
import * as orchestrator from '../../orchestrator/index.js';
import { Header } from '../components/Header.js';
import { Separator } from '../components/Separator.js';
import { StepRow } from '../components/StepRow.js';
import { Footer } from '../components/Footer.js';
import { MODEL_CATALOG } from '../../models/catalog.js';
import { buildDefaultSteps } from '../../pipeline/steps.js';
import type { PipelineRun, PipelineStep, AgentRole } from '../../types/index.js';
import type { PipelineEvent } from '../../types/events.js';

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
}: PipelineScreenProps) {
  const app = useApp();
  const [steps, setSteps] = useState<PipelineStep[]>(() => buildDefaultSteps(skipRoles));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [maxIterations, setMaxIterations] = useState(2);

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

  useInput((input, key) => {
    if (showPicker) return; // handled inside ModelPicker
    if (isRunning) return; // lock input while pipeline is executing

    if (input === 'q') app.exit();
    if (key.upArrow) setFocusedIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) setFocusedIndex((i) => Math.min(steps.length - 1, i + 1));
    if (input === 'm') setShowPicker(true);
    if (key.return) {
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
      <Header companionState={companionState} speech={companionSpeech} />
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
