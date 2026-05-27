import { render } from 'ink';
import React from 'react';
import { HistoryScreen } from '../../ui/screens/HistoryScreen.js';
import { Workspace } from '../../ui/workspace/Workspace.js';
import { listRuns } from '../../storage/index.js';

export async function historyCommand(
  options: { json?: boolean; limit?: number } = {},
): Promise<void> {
  if (options.json) {
    const runs = await listRuns();
    const displayed = runs.slice(0, options.limit ?? 20);
    process.stdout.write(JSON.stringify(displayed, null, 2) + '\n');
    return;
  }

  const state: { rerunIntent: string | null } = { rerunIntent: null };

  const { waitUntilExit } = render(
    React.createElement(HistoryScreen, {
      onRerun: (intent: string) => {
        state.rerunIntent = intent;
      },
    }),
  );
  await waitUntilExit();

  if (state.rerunIntent !== null) {
    const { waitUntilExit: waitApp } = render(
      React.createElement(Workspace, { initialIntent: state.rerunIntent }),
    );
    await waitApp();
  }
}
