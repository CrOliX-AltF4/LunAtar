import type { CompanionState } from '../components/Companion.js';
import type { PipelineStep } from '../../types/index.js';

export const COMP_WIDTH = 30;
export const DIVIDER_W = 1;

export type WorkspaceView =
  | 'welcome'
  | 'setup'
  | 'prompt'
  | 'config'
  | 'pipeline'
  | 'results'
  | 'history';

export interface CompanionUpdate {
  state: CompanionState;
  poSpeech?: string;
  qaSpeech?: string;
}

export type OnCompanionChange = (update: CompanionUpdate) => void;

export type OnStepsChange = (steps: PipelineStep[]) => void;
