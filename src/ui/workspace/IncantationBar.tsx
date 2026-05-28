import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import chalk from 'chalk';
import { GOLD } from '../theme.js';
import { Separator } from '../components/Separator.js';

// ─── Slash command registry (shown as hints) ──────────────────────────────────

const SLASH_COMMANDS = [
  { cmd: '/history', desc: 'annales — browse past runs' },
  { cmd: '/arsenal', desc: 'select skills & plugins for next run' },
  { cmd: '/setup', desc: 'arm the forge — configure API keys' },
  { cmd: '/costs', desc: 'combustible — cost dashboard' },
  { cmd: '/demo', desc: 'demo pipeline — no API key needed' },
];

const MAX_HINTS = 5;

interface IncantationBarProps {
  locked: boolean;
  onSubmit: (intent: string) => void;
  onCommand?: (cmd: string, args: string) => void;
  activeCount?: number;
}

export function IncantationBar({ locked, onSubmit, onCommand, activeCount }: IncantationBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setValue('');

    if (trimmed.startsWith('/')) {
      const [rawCmd = '', ...rest] = trimmed.slice(1).split(' ');
      const cmd = rawCmd.toLowerCase();
      const args = rest.join(' ');
      onCommand?.(cmd, args);
      return;
    }

    onSubmit(trimmed);
  };

  const showHints = value.startsWith('/');
  const allMatches = showHints
    ? SLASH_COMMANDS.filter((c) => c.cmd.startsWith(value.toLowerCase()))
    : [];
  const matchedCommands = allMatches.slice(0, MAX_HINTS);
  const hiddenCount = allMatches.length - matchedCommands.length;

  return (
    <Box flexDirection="column">
      <Separator />

      <Box flexDirection="column" paddingX={2} paddingY={1} gap={0}>
        {locked ? (
          <Box gap={1}>
            <Text color="gray" dimColor>
              ▣ Forging — incantation locked
            </Text>
          </Box>
        ) : (
          <>
            {/* Slash command hints */}
            {matchedCommands.length > 0 && (
              <Box flexDirection="column" marginBottom={1}>
                {matchedCommands.map(({ cmd, desc }) => (
                  <Box key={cmd} gap={2}>
                    <Text color={GOLD}>{cmd}</Text>
                    <Text color="gray" dimColor>
                      {desc}
                    </Text>
                  </Box>
                ))}
                {hiddenCount > 0 && (
                  <Text color="gray" dimColor>
                    … {String(hiddenCount)} more
                  </Text>
                )}
              </Box>
            )}

            <Box borderStyle="single" borderColor={GOLD} paddingX={1}>
              <Box gap={1}>
                <Text>{chalk.hex(GOLD)('›')}</Text>
                <TextInput
                  value={value}
                  onChange={setValue}
                  onSubmit={handleSubmit}
                  placeholder="a REST API to manage users… or /command"
                />
              </Box>
            </Box>

            <Box gap={3} marginTop={1}>
              <Text color="gray" dimColor>
                <Text>{chalk.hex(GOLD)('[↵]')}</Text>
                <Text color="gray"> fire the forge</Text>
              </Text>
              <Text color="gray" dimColor>
                <Text>{chalk.hex(GOLD)('[/]')}</Text>
                <Text color="gray"> commands</Text>
              </Text>
              {activeCount !== undefined && activeCount > 0 && (
                <Text color="yellow">⚙ {String(activeCount)} active</Text>
              )}
              <Text color="gray" dimColor>
                <Text>{chalk.hex(GOLD)('[ctrl+c]')}</Text>
                <Text color="gray"> quit</Text>
              </Text>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
