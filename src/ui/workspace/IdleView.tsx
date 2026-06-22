import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { ORACLE_MESSAGES, GOLD } from '../theme.js';
import { Separator } from '../components/Separator.js';
import { SLASH_COMMANDS } from './commandMatcher.js';
import { fullSpriteLines as f0 } from '../components/mascot-frame-0.js';
import { fullSpriteLines as f1 } from '../components/mascot-frame-1.js';
import { fullSpriteLines as f2 } from '../components/mascot-frame-2.js';
import { fullSpriteLines as f3 } from '../components/mascot-frame-3.js';
import { fullSpriteLines as f4 } from '../components/mascot-frame-4.js';
import { fullSpriteLines as f5 } from '../components/mascot-frame-5.js';
import { fullSpriteLines as f6 } from '../components/mascot-frame-6.js';
import { fullSpriteLines as f7 } from '../components/mascot-frame-7.js';

const FRAMES = [f0, f1, f2, f3, f4, f5, f6, f7] as const;
const FRAME_MS = 160;

export function IdleView() {
  const [frameIdx, setFrameIdx] = useState(0);
  const [oracle] = useState<string>(
    () =>
      ORACLE_MESSAGES[Math.floor(Math.random() * ORACLE_MESSAGES.length)] ??
      '"A patient blacksmith forges twice."',
  );

  useEffect(() => {
    const id = setInterval(() => {
      setFrameIdx((i) => (i + 1) % FRAMES.length);
    }, FRAME_MS);
    return () => {
      clearInterval(id);
    };
  }, []);

  const lines = (FRAMES[frameIdx] ?? FRAMES[0])('idle');

  return (
    <Box flexDirection="column">
      <Separator />

      <Box flexDirection="row" paddingX={2} paddingY={1} gap={3}>
        {/* Living flame — 8-frame sinusoidal animation */}
        <Box flexDirection="column" gap={0}>
          {lines.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </Box>

        {/* Oracle + hint */}
        <Box flexDirection="column" gap={1} justifyContent="center">
          <Text color={GOLD}>⚄ {oracle}</Text>
          <Text color="gray" dimColor>
            type <Text color="yellow">/</Text> for commands
          </Text>
          <Text>
            {SLASH_COMMANDS.map((c, i) => (
              <React.Fragment key={c.cmd}>
                <Text color={GOLD} dimColor>
                  {c.cmd}
                </Text>
                {i < SLASH_COMMANDS.length - 1 && <Text color="gray"> · </Text>}
              </React.Fragment>
            ))}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
