import { render } from 'ink';
import React from 'react';
import { Workspace } from '../../ui/workspace/Workspace.js';

export async function welcomeCommand(): Promise<void> {
  const { waitUntilExit } = render(React.createElement(Workspace, { startOnWelcome: true }));
  await waitUntilExit();
}
