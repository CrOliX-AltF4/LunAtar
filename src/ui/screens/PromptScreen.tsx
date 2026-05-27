import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import chalk from 'chalk';
import { Header } from '../components/Header.js';
import { Separator } from '../components/Separator.js';
import { GOLD, COPPER } from '../theme.js';

// ─── Forge hints panel ────────────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

interface PromptScreenProps {
  onSubmit: (intent: string) => void;
}

export function PromptScreen({ onSubmit }: PromptScreenProps) {
  const [value, setValue] = useState('');
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

  const handleSubmit = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.length > 0) onSubmit(trimmed);
  };

  return (
    <Box flexDirection="column">
      <Header companionState="idle" />
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

        {/* ╔═ Copper input border ═══════════════════════════════════════ */}
        <Box borderStyle="single" borderColor={COPPER} paddingX={1}>
          <Box gap={1}>
            <Text>{chalk.hex(GOLD)('⚒ ›')}</Text>
            <TextInput
              value={value}
              onChange={setValue}
              onSubmit={handleSubmit}
              placeholder="a REST API to manage users..."
            />
          </Box>
        </Box>

        <Box gap={3} marginTop={1} marginBottom={2}>
          <Text color="gray" dimColor>
            <Text>{chalk.hex(GOLD)('[↵]')}</Text>
            <Text color="gray"> fire the forge</Text>
          </Text>
          <Text color="gray" dimColor>
            <Text>{chalk.hex(GOLD)('[ctrl+c]')}</Text>
            <Text color="gray"> quit</Text>
          </Text>
        </Box>

        <ForgeHints cols={cols} />
      </Box>
    </Box>
  );
}
