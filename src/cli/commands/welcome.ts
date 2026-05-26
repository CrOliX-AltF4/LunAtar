import { render } from 'ink';
import React from 'react';
import { WelcomeScreen } from '../../ui/screens/WelcomeScreen.js';

export async function welcomeCommand(): Promise<void> {
  const { waitUntilExit } = render(
    React.createElement(WelcomeScreen, { onComplete: () => process.exit(0) }),
  );
  await waitUntilExit();
}
