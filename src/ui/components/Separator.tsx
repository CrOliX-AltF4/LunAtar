import React from 'react';
import { Text } from 'ink';
import chalk from 'chalk';
import { GOLD } from '../theme.js';
import { usePanelCols } from '../workspace/PanelContext.js';

export function Separator() {
  const cols = usePanelCols();
  const half = Math.floor((cols - 3) / 2);
  const rest = cols - half - 3;
  return (
    <Text>
      {chalk.gray('─'.repeat(half))}
      {chalk.hex(GOLD)(' ◆ ')}
      {chalk.gray('─'.repeat(rest))}
    </Text>
  );
}
