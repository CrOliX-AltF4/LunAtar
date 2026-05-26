import React from 'react';
import { Box, Text } from 'ink';
import { useSystemMetrics } from '../hooks/useSystemMetrics.js';
import { BRAND_COLOR, BRAND_NAME, BRAND_TAGLINE } from '../theme.js';
import packageJson from '../../../package.json';

const { version } = packageJson;

export function Header() {
  const { cpuUsagePercent, memUsedMb, memTotalMb } = useSystemMetrics();

  const memUsedGb = (memUsedMb / 1024).toFixed(1);
  const memTotalGb = (memTotalMb / 1024).toFixed(1);
  const cpuColor = cpuUsagePercent > 80 ? 'red' : cpuUsagePercent > 50 ? 'yellow' : 'green';

  return (
    <Box borderStyle="round" borderColor={BRAND_COLOR} paddingX={1} justifyContent="space-between">
      <Box gap={2}>
        <Box gap={1}>
          <Text color={BRAND_COLOR} bold>
            {BRAND_NAME}
          </Text>
          <Text color="gray" dimColor>
            {BRAND_TAGLINE}
          </Text>
        </Box>
        <Text color="gray" dimColor>
          v{version}
        </Text>
      </Box>
      <Box gap={2}>
        <Box gap={1}>
          <Text color="gray">CPU</Text>
          <Text color={cpuColor} bold>
            {cpuUsagePercent}%
          </Text>
        </Box>
        <Box gap={1}>
          <Text color="gray">RAM</Text>
          <Text color="white">
            {memUsedGb}
            <Text color="gray">/{memTotalGb} GB</Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
