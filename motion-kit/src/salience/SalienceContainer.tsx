/**
 * motion-kit/src/salience/SalienceContainer.tsx
 *
 * Context provider managing dual visual salience state across child items.
 */

import React, { createContext, useContext } from 'react';
import { VisualSalienceResult, SalienceContainerProps, TimelineBeat } from './types';
import { useVisualSalience } from './useVisualSalience';

export const SalienceContext = createContext<VisualSalienceResult | null>(null);

export function useSalienceContext(): VisualSalienceResult {
  const ctx = useContext(SalienceContext);
  if (!ctx) {
    throw new Error('useSalienceContext must be used within a <SalienceContainer>');
  }
  return ctx;
}

export function SalienceContainer<T extends TimelineBeat = TimelineBeat>({
  children,
  ...options
}: SalienceContainerProps<T>): React.ReactElement {
  const salience = useVisualSalience(options);

  return (
    <SalienceContext.Provider value={salience}>
      {children}
    </SalienceContext.Provider>
  );
}
