import React from 'react';
import { Text } from 'ink';
import { passion } from 'gradient-string';
import chalk from 'chalk';
import { usePanelCols } from '../workspace/PanelContext.js';

const BRAND = passion("⚒  Lun'Atar");
const BRAND_VISIBLE = 11; // visible columns of "⚒  Lun'Atar"

export function Separator() {
  const cols = usePanelCols();

  const prefix = '─── ';
  const suffix = '  ';
  const remaining = Math.max(2, cols - prefix.length - BRAND_VISIBLE - suffix.length);

  return <Text>{chalk.gray(prefix) + BRAND + chalk.gray(suffix + '─'.repeat(remaining))}</Text>;
}
