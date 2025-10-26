/**
 * Rimmarsa Design System - Color Palette
 * Based on web platform design (dark theme)
 */

export const colors = {
  // Primary (Emerald Green)
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Core primary
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Secondary (Amber)
  secondary: {
    400: '#F59E0B',
    500: '#D97706',
  },

  // Success
  success: {
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
  },

  // Error
  error: {
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
  },

  // Warning
  warning: {
    400: '#FBBF24',
    500: '#F59E0B',
  },

  // Grayscale (Dark Theme)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',  // Labels, readable text
    400: '#9CA3AF',  // Hints, placeholders
    500: '#6B7280',  // Medium dark
    600: '#4B5563',  // Dark
    700: '#374151',  // Borders, dividers
    800: '#1F2937',  // Input backgrounds
    900: '#111827',  // Card backgrounds
    950: '#030712',  // Black background
  },

  // Semantic colors
  background: {
    primary: '#030712',   // Main background
    secondary: '#111827', // Card background
    tertiary: '#1F2937',  // Input background
  },

  text: {
    primary: '#FFFFFF',   // Main text
    secondary: '#D1D5DB', // Secondary text (gray-300)
    tertiary: '#9CA3AF',  // Tertiary text (gray-400)
    disabled: '#6B7280',  // Disabled text (gray-500)
  },

  border: {
    default: '#374151',   // gray-700
    focus: '#10B981',     // primary-500
    error: '#EF4444',     // error-500
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
