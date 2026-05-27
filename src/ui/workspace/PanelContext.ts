import { createContext, useContext } from 'react';

interface PanelCtx {
  cols: number;
}

const PanelContext = createContext<PanelCtx>({ cols: 80 });

export const PanelProvider = PanelContext.Provider;

export function usePanelCols(): number {
  return useContext(PanelContext).cols;
}
