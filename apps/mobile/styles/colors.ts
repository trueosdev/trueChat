// TrueCSS Color System
// A minimal black, white, and gray palette

export const Colors = {
  // Primary Colors
  background: '#000000',
  surface: '#000000',
  primary: '#FFFFFF',
  secondary: '#808080',
  border: '#808080',
  
  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#808080',
  
  // Semantic Colors
  destructive: '#FF3B30',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.85)',
} as const;

export type ColorKey = keyof typeof Colors;

