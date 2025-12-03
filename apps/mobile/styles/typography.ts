import { StyleSheet } from 'react-native';
import { Colors } from './colors';

// TrueCSS Typography System

export const FontSize = {
  display: 32,
  large: 20,
  medium: 18,
  normal: 16,
  small: 14,
  xsmall: 12,
} as const;

export const FontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
};

export const Typography = StyleSheet.create({
  // Headings
  headingLarge: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  headingMedium: {
    fontSize: FontSize.large,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  headingSmall: {
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  
  // Body text
  bodyPrimary: {
    fontSize: FontSize.normal,
    fontWeight: FontWeight.normal,
    color: Colors.textPrimary,
  },
  bodySecondary: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.normal,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: FontSize.xsmall,
    fontWeight: FontWeight.normal,
    color: Colors.textSecondary,
  },
  
  // Button text
  buttonText: {
    fontSize: FontSize.normal,
    fontWeight: FontWeight.medium,
  },
});

