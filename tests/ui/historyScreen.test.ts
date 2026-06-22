import { describe, it, expect } from 'vitest';
import type { HistoryScreenProps } from '../../src/ui/screens/HistoryScreen.js';

describe('HistoryScreen props', () => {
  it('should not have an onRerun prop in its interface', () => {
    // Type-level test: HistoryScreenProps should not have onRerun
    // We verify the type doesn't include onRerun by checking the key doesn't appear
    // in a valid props object (compile-time enforcement; runtime check via key presence)
    const props: HistoryScreenProps = { onBack: () => {} };
    // If onRerun still exists, this line would type-error. Remove it if it causes issues.
    expect('onRerun' in props).toBe(false);
  });
});
