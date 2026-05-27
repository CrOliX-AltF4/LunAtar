import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import chalk from 'chalk';
import { fullSpriteLines } from './companion-sprite.js';

export type CompanionState = 'idle' | 'thinking' | 'forging' | 'error' | 'done';
type CompanionMode = 'micro' | 'compact' | 'full';

// ─── Compact sprite (10 lines, hand-crafted for small terminals) ──────────────

const G = chalk.hex('#C8A415');
const W = chalk.white;
const Wd = chalk.white.dim;
const A = chalk.hex('#4A3728');

const EYE_SYM: Record<CompanionState, { sym: string; colorHex: string }> = {
  idle: { sym: '◉', colorHex: '#C8A415' },
  thinking: { sym: '◔', colorHex: '#888888' },
  forging: { sym: '●', colorHex: '#FF8C00' },
  error: { sym: '✖', colorHex: '#FF4444' },
  done: { sym: '◉', colorHex: '#44CC44' },
};

function compactEyeLine(state: CompanionState): string {
  const { sym, colorHex } = EYE_SYM[state];
  const eye = chalk.hex(colorHex);
  return G('▐█') + eye(sym) + G('   ') + eye(sym) + G('█▌');
}

function compactLines(state: CompanionState): string[] {
  return [
    '   ' + G('▲') + '     ' + G('▲') + '   ',
    '  ' + G('▄█████▄') + '   ',
    ' ' + G('▐███████▌') + '  ',
    ' ' + compactEyeLine(state) + '  ',
    ' ' + G('▐█') + W(' ╰─╯ ') + G('█▌') + '  ',
    ' ' + G('▐') + W('███████') + G('▌') + '  ',
    '  ' + W('███████') + '   ',
    '  ' + Wd('▓▓▓▓▓▓▓') + '   ',
    '   ' + A('█████') + '    ',
    '   ' + A('█') + '   ' + A('█') + '    ',
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CompanionProps {
  state?: CompanionState;
}

export function Companion({ state = 'idle' }: CompanionProps) {
  const { stdout } = useStdout();
  const [rows, setRows] = useState<number>(stdout.rows || 40);

  useEffect(() => {
    const onResize = () => {
      setRows(stdout.rows || 40);
    };
    stdout.on('resize', onResize);
    return () => {
      stdout.removeListener('resize', onResize);
    };
  }, [stdout]);

  const mode: CompanionMode = rows < 20 ? 'micro' : rows < 35 ? 'compact' : 'full';

  if (mode === 'micro') {
    const { sym, colorHex } = EYE_SYM[state];
    const eye = chalk.hex(colorHex);
    return <Text>{G('[') + eye(sym) + ' ' + eye(sym) + G(']')}</Text>;
  }

  const lines = mode === 'full' ? fullSpriteLines(state) : compactLines(state);

  return (
    <Box flexDirection="column">
      {lines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
    </Box>
  );
}
