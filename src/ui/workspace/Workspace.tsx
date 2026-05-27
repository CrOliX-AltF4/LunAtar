import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import { TitleBar } from './TitleBar.js';
import { CompanionColumn } from './CompanionColumn.js';
import { PanelProvider } from './PanelContext.js';
import { IdleView } from './IdleView.js';
import { IncantationBar } from './IncantationBar.js';
import { PipelineScreen } from '../screens/PipelineScreen.js';
import { ResultsScreen } from '../screens/ResultsScreen.js';
import { SetupScreen } from '../screens/SetupScreen.js';
import { ConfigScreen } from '../screens/ConfigScreen.js';
import { WelcomeScreen } from '../screens/WelcomeScreen.js';
import { listConfiguredProviders } from '../../providers/config.js';
import { COMP_WIDTH, DIVIDER_W } from './types.js';
import type { WorkspaceView } from './types.js';
import type { CompanionState } from '../components/Companion.js';
import type { AgentRole, PipelineRun, PipelineStep } from '../../types/index.js';

interface WorkspaceProps {
  initialIntent?: string;
  skipRoles?: ReadonlySet<AgentRole>;
  startOnWelcome?: boolean;
}

export function Workspace({ initialIntent, skipRoles, startOnWelcome = false }: WorkspaceProps) {
  const { stdout } = useStdout();
  const [cols, setCols] = useState(stdout.columns || 80);

  useEffect(() => {
    const onResize = () => {
      setCols(stdout.columns || 80);
    };
    stdout.on('resize', onResize);
    return () => {
      stdout.removeListener('resize', onResize);
    };
  }, [stdout]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const [view, setView] = useState<WorkspaceView>(() => {
    if (startOnWelcome) return 'welcome';
    if (listConfiguredProviders().length === 0) return 'setup';
    return initialIntent ? 'pipeline' : 'prompt';
  });
  const [intent, setIntent] = useState(initialIntent ?? '');
  const [completedRun, setCompletedRun] = useState<PipelineRun | null>(null);
  const [activeSkillIds, setActiveSkillIds] = useState<string[]>([]);
  const [activePluginIds, setActivePluginIds] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number | undefined>(undefined);
  const [totalSteps, setTotalSteps] = useState<number | undefined>(undefined);

  // ── Companion state ─────────────────────────────────────────────────────────
  const [companionState, setCompanionState] = useState<CompanionState>('idle');
  const [poSpeech, setPoSpeech] = useState<string | undefined>(undefined);
  const [qaSpeech, setQaSpeech] = useState<string | undefined>(undefined);
  const [guildeSteps, setGuildeSteps] = useState<PipelineStep[]>([]);

  // ── Navigation handlers ─────────────────────────────────────────────────────
  const handleIntentFromBar = (value: string) => {
    setIntent(value);
    setCompletedRun(null);
    setGuildeSteps([]);
    setCurrentStep(undefined);
    setTotalSteps(undefined);
    setView('pipeline');
    setCompanionState('forging');
    setPoSpeech(value);
    setQaSpeech(undefined);
  };

  const handleConfigConfirm = (skillIds: string[], pluginIds: string[]) => {
    setActiveSkillIds(skillIds);
    setActivePluginIds(pluginIds);
    setCurrentStep(1);
    setView('pipeline');
    setCompanionState('forging');
    setPoSpeech(intent);
    setQaSpeech(undefined);
  };

  const handlePipelineComplete = (run: PipelineRun) => {
    setCompletedRun(run);
    setView('results');
    setCompanionState('done');
    setPoSpeech(intent);
    setQaSpeech('Rune vérifiée. Artefact scellé.');
  };

  const handleStepsChange = (steps: PipelineStep[]) => {
    setGuildeSteps(steps);
    const active = steps.filter((s) => s.status !== 'skipped');
    const done = active.filter((s) => s.status === 'completed' || s.status === 'failed');
    if (active.length > 0) {
      setCurrentStep(done.length + 1);
      setTotalSteps(active.length);
    }
  };

  const handleNewPipeline = () => {
    setCompletedRun(null);
    setIntent('');
    setActiveSkillIds([]);
    setActivePluginIds([]);
    setCurrentStep(undefined);
    setTotalSteps(undefined);
    setGuildeSteps([]);
    setView('prompt');
    setCompanionState('idle');
    setPoSpeech(undefined);
    setQaSpeech(undefined);
  };

  // ── Layout ──────────────────────────────────────────────────────────────────
  const rightCols = Math.max(20, cols - COMP_WIDTH - DIVIDER_W);

  function renderView() {
    switch (view) {
      case 'welcome':
        return (
          <WelcomeScreen
            onComplete={() => {
              setView(initialIntent ? 'pipeline' : 'prompt');
              setCompanionState('idle');
              setPoSpeech(undefined);
              setQaSpeech(undefined);
            }}
          />
        );
      case 'setup':
        return (
          <SetupScreen
            onComplete={() => {
              setView('prompt');
              setCompanionState('idle');
              setPoSpeech(undefined);
              setQaSpeech(undefined);
            }}
          />
        );
      case 'prompt':
        return <IdleView />;
      case 'config':
        return (
          <ConfigScreen
            onConfirm={handleConfigConfirm}
            onBack={() => {
              setView('prompt');
              setCompanionState('idle');
              setPoSpeech(undefined);
              setQaSpeech(undefined);
            }}
          />
        );
      case 'results':
        return completedRun ? (
          <ResultsScreen run={completedRun} onNewPipeline={handleNewPipeline} />
        ) : null;
      default:
        return (
          <PipelineScreen
            intent={intent}
            onComplete={handlePipelineComplete}
            onStepsChange={handleStepsChange}
            {...(skipRoles ? { skipRoles } : {})}
            {...(activeSkillIds.length > 0 ? { activeSkillIds } : {})}
            {...(activePluginIds.length > 0 ? { activePluginIds } : {})}
          />
        );
    }
  }

  return (
    <Box flexDirection="column">
      <TitleBar
        companionState={companionState}
        {...(currentStep !== undefined ? { currentStep } : {})}
        {...(totalSteps !== undefined ? { totalSteps } : {})}
      />

      <Box flexDirection="row">
        <CompanionColumn
          state={companionState}
          {...(poSpeech !== undefined ? { poSpeech } : {})}
          {...(qaSpeech !== undefined ? { qaSpeech } : {})}
          {...(guildeSteps.length > 0 ? { guildeSteps } : {})}
        />

        <Box width={DIVIDER_W} flexDirection="column">
          <Text color="gray">│</Text>
        </Box>

        <PanelProvider value={{ cols: rightCols }}>
          <Box flexGrow={1} flexDirection="column">
            {renderView()}
          </Box>
          <IncantationBar
            locked={view !== 'prompt' && view !== 'results'}
            onSubmit={handleIntentFromBar}
          />
        </PanelProvider>
      </Box>
    </Box>
  );
}
