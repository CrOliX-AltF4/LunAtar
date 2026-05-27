import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import chalk from 'chalk';
import { Header } from '../components/Header.js';
import { Separator } from '../components/Separator.js';
import { SetupScreen } from './SetupScreen.js';
import { GOLD } from '../theme.js';
import { setApiKey } from '../../providers/config.js';

type WelcomeMode = 'choose' | 'simple-key' | 'expert';

interface WelcomeScreenProps {
  onComplete: () => void;
}

const MODES = [
  {
    key: 'simple' as const,
    label: 'Simple',
    desc: 'One OpenRouter key — access to 200+ models, free tier, no credit card',
  },
  {
    key: 'expert' as const,
    label: 'Expert',
    desc: 'Configure each provider separately (Groq, Claude, OpenAI…)',
  },
];

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [mode, setMode] = useState<WelcomeMode>('choose');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');

  useInput((input, key) => {
    if (mode === 'simple-key' && key.escape) {
      setMode('choose');
      setInputValue('');
      return;
    }
    if (mode !== 'choose') return;
    if (key.upArrow) setFocusedIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) setFocusedIndex((i) => Math.min(MODES.length - 1, i + 1));
    if (input === '1') setFocusedIndex(0);
    if (input === '2') setFocusedIndex(1);
    if (key.return) {
      if (focusedIndex === 0) setMode('simple-key');
      else setMode('expert');
    }
  });

  const handleKeySubmit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) setApiKey('openrouter', trimmed);
    onComplete();
  };

  if (mode === 'expert') {
    return (
      <SetupScreen
        onComplete={onComplete}
        onBack={() => {
          setMode('choose');
        }}
      />
    );
  }

  if (mode === 'simple-key') {
    return (
      <Box flexDirection="column">
        <Header companionState="idle" speech="Paste your OpenRouter key to light the forge." />
        <Separator />

        <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
          <Text color="white" bold>
            OpenRouter key
          </Text>
          <Text color="gray">
            Create an account at <Text color="white">openrouter.ai</Text> and copy your API key.
          </Text>
          <Text color="gray" dimColor>
            Free models available — no credit card required to start.
          </Text>

          <Box
            flexDirection="column"
            marginTop={1}
            borderStyle="round"
            borderColor="cyan"
            paddingX={2}
            paddingY={1}
          >
            <Box gap={1}>
              <Text>{chalk.hex(GOLD)('›')}</Text>
              <TextInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleKeySubmit}
                placeholder="sk-or-v1-..."
                mask="*"
              />
            </Box>
            <Text color="gray" dimColor>
              <Text color="yellow">[↵]</Text> continue · <Text color="yellow">[Esc]</Text> back ·
              leave empty to skip
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Header companionState="idle" speech="The forge is cold. How will you light it?" />
      <Separator />

      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        <Text color="white" bold>
          Choose your setup path
        </Text>

        <Box flexDirection="column" marginTop={1} gap={1}>
          {MODES.map((m, i) => {
            const isFocused = focusedIndex === i;
            return (
              <Box key={m.key} flexDirection="column">
                <Box gap={2}>
                  <Text>{isFocused ? chalk.hex(GOLD)('▶') : ' '}</Text>
                  <Text color={isFocused ? 'white' : 'gray'} bold={isFocused}>
                    [{i + 1}] {m.label}
                  </Text>
                </Box>
                {isFocused && (
                  <Box marginLeft={4}>
                    <Text color="gray">{m.desc}</Text>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        <Box gap={3} marginTop={1}>
          <Text color="gray">
            <Text>{chalk.hex(GOLD)('[↑↓]')}</Text> navigate
          </Text>
          <Text color="gray">
            <Text>{chalk.hex(GOLD)('[↵]')}</Text> confirm
          </Text>
          <Text color="gray">
            <Text>{chalk.hex(GOLD)('[1][2]')}</Text> quick select
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
