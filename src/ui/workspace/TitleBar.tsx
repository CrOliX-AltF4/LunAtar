import React from 'react';
import { Box, Text } from 'ink';
import { passion } from 'gradient-string';
import path from 'node:path';
import { useSystemMetrics } from '../hooks/useSystemMetrics.js';
import packageJson from '../../../package.json' assert { type: 'json' };
import type { CompanionState } from '../components/Companion.js';
import { GOLD } from '../theme.js';

const { version } = packageJson;
const BRAND = passion("⚒ Lun'Atar");

function xpBar(current: number, total: number): string {
  const filled = total > 0 ? Math.round((current / total) * 8) : 0;
  return '█'.repeat(filled) + '░'.repeat(8 - filled);
}

const WEATHER: Record<CompanionState, string> = {
  idle: '❄  Forge froide',
  thinking: '☁  Forge tiède · 318°',
  forging: '🔥 Forge ardente · 540°',
  error: '✖  Forge éteinte',
  done: '✦  Artefact forgé',
};

interface TitleBarProps {
  companionState: CompanionState;
  currentStep?: number;
  totalSteps?: number;
}

export function TitleBar({ companionState, currentStep, totalSteps }: TitleBarProps) {
  const { cpuUsagePercent, memUsedMb, memTotalMb } = useSystemMetrics();
  const projectName = path.basename(process.cwd());
  const cpuColor = cpuUsagePercent > 80 ? 'red' : cpuUsagePercent > 50 ? 'yellow' : 'green';
  const memUsedGb = (memUsedMb / 1024).toFixed(1);
  const memTotalGb = (memTotalMb / 1024).toFixed(1);

  const etage =
    currentStep !== undefined && totalSteps !== undefined
      ? `Étage ${String(currentStep)}/${String(totalSteps)}`
      : undefined;

  return (
    <Box justifyContent="space-between" paddingX={1}>
      <Box gap={2}>
        <Text>{BRAND}</Text>
        <Text color="gray">·</Text>
        <Text color="gray" dimColor>
          Donjon:
        </Text>
        <Text color="white" bold>
          {projectName}
        </Text>
        {etage !== undefined && (
          <>
            <Text color="gray">·</Text>
            <Text color="gray" dimColor>
              {etage}
            </Text>
          </>
        )}
        {currentStep !== undefined && totalSteps !== undefined && (
          <>
            <Text color="gray">·</Text>
            <Text color="gray" dimColor>
              XP{' '}
            </Text>
            <Text color={GOLD}>{xpBar(currentStep, totalSteps)}</Text>
          </>
        )}
        <Text color="gray">·</Text>
        <Text color="gray" dimColor>
          {WEATHER[companionState]}
        </Text>
      </Box>
      <Box gap={2}>
        <Text color="gray" dimColor>
          v{version}
        </Text>
        <Text color="gray">
          CPU{' '}
          <Text color={cpuColor} bold>
            {cpuUsagePercent}%
          </Text>
        </Text>
        <Text color="gray">
          RAM <Text color="white">{memUsedGb}</Text>
          <Text color="gray">/{memTotalGb}GB</Text>
        </Text>
      </Box>
    </Box>
  );
}
