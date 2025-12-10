// Type compatibility bridge for React 19
// This helps resolve type issues with component libraries that haven't fully updated for React 19

import type { ReactNode as ReactNodeType } from 'react';

declare module 'react' {
  // Re-export ReactNode to ensure compatibility
  export type ReactNode = ReactNodeType;
}

