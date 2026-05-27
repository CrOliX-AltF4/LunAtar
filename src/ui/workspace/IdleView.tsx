import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';
import { COPPER } from '../theme.js';
import { Separator } from '../components/Separator.js';
import { usePanelCols } from './PanelContext.js';

const TIPS: [string, string][] = [
  ['lunatar ask "…"         ', '— ask a question directly, no pipeline'],
  ['lunatar run --apply     ', '— dev agent writes files to your project'],
  ['lunatar run --file f.ts ', '— inject a file as context'],
  ['lunatar history         ', '— browse and re-run past pipelines'],
  ['Be specific             ', '— "a REST API with JWT + Postgres" > "an API"'],
];

function ForgeHints({ cols }: { cols: number }) {
  const innerWidth = Math.max(40, Math.min(cols - 6, 82));
  const label = ' Forge tips ';
  const topDashes = '─' + label + '─'.repeat(innerWidth - label.length - 1);
  const topLine = chalk.hex(COPPER)('┌' + topDashes + '┐');
  const emptyLine = chalk.hex(COPPER)('│') + ' '.repeat(innerWidth) + chalk.hex(COPPER)('│');
  const bottomLine = chalk.hex(COPPER)('└' + '─'.repeat(innerWidth) + '┘');

  return (
    <Box flexDirection="column">
      <Text>{topLine}</Text>
      <Text>{emptyLine}</Text>
      {TIPS.map(([cmd, desc], i) => {
        const content = '  ' + chalk.white(cmd) + chalk.gray(desc);
        const visibleLen = 2 + cmd.length + desc.length;
        const pad = ' '.repeat(Math.max(0, innerWidth - visibleLen));
        return (
          <Text key={i}>
            {chalk.hex(COPPER)('│')}
            {content}
            {pad}
            {chalk.hex(COPPER)('│')}
          </Text>
        );
      })}
      <Text>{emptyLine}</Text>
      <Text>{bottomLine}</Text>
    </Box>
  );
}

export function IdleView() {
  const cols = usePanelCols();

  return (
    <Box flexDirection="column">
      <Separator />

      <Box flexDirection="column" paddingX={2} paddingY={1} gap={0}>
        <Box marginBottom={1} gap={1}>
          <Text color="white" bold>
            What will you forge?
          </Text>
          <Text color="gray" dimColor>
            — describe your intent, the forge turns it into code
          </Text>
        </Box>

        <ForgeHints cols={cols} />

        <Box marginTop={1} paddingX={1}>
          <Text color="gray" dimColor>
            <Text color="gray">[h]</Text> annales de forge
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
