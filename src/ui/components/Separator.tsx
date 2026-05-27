import React, { useState, useEffect } from 'react';
import { Text, useStdout } from 'ink';
import { passion } from 'gradient-string';
import chalk from 'chalk';

const BRAND = passion("⚒  Lun'Atar");
const BRAND_VISIBLE = 11; // visible columns of "⚒  Lun'Atar"

export function Separator() {
  const { stdout } = useStdout();
  const [cols, setCols] = useState(stdout.columns || 80);

  useEffect(() => {
    const onResize = () => {
      setCols(stdout.columns || 80);
    };
    stdout.on('resize', onResize);
    return () => stdout.removeListener('resize', onResize);
  }, [stdout]);

  const prefix = '─── ';
  const suffix = '  ';
  const remaining = Math.max(2, cols - prefix.length - BRAND_VISIBLE - suffix.length);

  return <Text>{chalk.gray(prefix) + BRAND + chalk.gray(suffix + '─'.repeat(remaining))}</Text>;
}
