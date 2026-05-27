import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import chalk from 'chalk';
import { GOLD } from '../theme.js';
import { Separator } from '../components/Separator.js';

interface IncantationBarProps {
  locked: boolean;
  onSubmit: (intent: string) => void;
}

export function IncantationBar({ locked, onSubmit }: IncantationBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
      setValue('');
    }
  };

  return (
    <Box flexDirection="column">
      <Separator />

      <Box flexDirection="column" paddingX={2} paddingY={1} gap={0}>
        {locked ? (
          <Box gap={1}>
            <Text color="gray" dimColor>
              ▣ Forge en cours — incantation verrouillée
            </Text>
          </Box>
        ) : (
          <>
            <Box borderStyle="single" borderColor={GOLD} paddingX={1}>
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

            <Box gap={3} marginTop={1}>
              <Text color="gray" dimColor>
                <Text>{chalk.hex(GOLD)('[↵]')}</Text>
                <Text color="gray"> fire the forge</Text>
              </Text>
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
