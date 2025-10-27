# Rimmarsa Vendor App - Design System Specification

## Overview
Complete design system for the Rimmarsa vendor mobile application, based on the web platform's dark theme design. This document provides exact specifications for React Native implementation.

---

## 1. Color System

### Primary Colors
```javascript
const colors = {
  primary: {
    50: '#ECFDF5',   // Very light mint
    100: '#D1FAE5',  // Light mint
    200: '#A7F3D0',  // Soft mint
    300: '#6EE7B7',  // Mint
    400: '#34D399',  // Primary emerald (main brand)
    500: '#10B981',  // Emerald green (core primary)
    600: '#059669',  // Deep emerald
    700: '#047857',  // Dark emerald
    800: '#065F46',  // Deeper emerald
    900: '#064E3B',  // Darkest emerald
  },

  secondary: {
    400: '#F59E0B',  // Amber accent
    500: '#D97706',  // Deep amber
  },

  success: {
    400: '#34D399',  // Green success
    500: '#10B981',
    600: '#059669',
  },

  error: {
    400: '#F87171',  // Red error
    500: '#EF4444',
    600: '#DC2626',
  },

  warning: {
    400: '#FBBF24',  // Yellow warning
    500: '#F59E0B',
  },
}
```

### Grayscale (Dark Theme)
```javascript
const grays = {
  50: '#F9FAFB',   // Lightest
  100: '#F3F4F6',  // Very light
  200: '#E5E7EB',  // Light
  300: '#D1D5DB',  // Medium light (labels)
  400: '#9CA3AF',  // Medium (hints, placeholders)
  500: '#6B7280',  // Medium dark
  600: '#4B5563',  // Dark
  700: '#374151',  // Darker (borders, dividers)
  800: '#1F2937',  // Very dark (input backgrounds)
  900: '#111827',  // Darkest (card backgrounds)
  950: '#030712',  // Black (main background)
}
```

### Background Gradients
```javascript
const backgrounds = {
  main: 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #000000 100%)',
  card: 'rgba(17, 24, 39, 0.5)', // gray-900/50 with blur
  input: '#1F2937',  // gray-800
  elevated: '#111827', // gray-900
}
```

### Usage Guidelines
- **Primary (Emerald)**: CTA buttons, links, progress indicators, active states
- **Secondary (Amber)**: Warning badges, highlights, special indicators
- **Success (Green)**: Confirmation messages, success states, checkmarks
- **Error (Red)**: Error messages, delete actions, validation errors
- **Gray Scale**: Text, backgrounds, borders, shadows

---

## 2. Typography

### Font Families
```javascript
const fonts = {
  primary: 'Cairo', // For Arabic text (RTL support)
  fallback: 'System', // Platform default
}
```

### Font Sizes (React Native)
```javascript
const fontSizes = {
  xs: 12,    // Hints, captions
  sm: 14,    // Secondary text, labels
  base: 16,  // Body text, input text
  lg: 18,    // Large body text
  xl: 20,    // Section headers
  '2xl': 24, // Page headers, step titles
  '3xl': 30, // Modal titles, success messages
  '4xl': 36, // Hero titles, main headings
}
```

### Font Weights
```javascript
const fontWeights = {
  normal: '400',
  medium: '500',  // Labels, secondary headings
  semibold: '600', // Buttons, important text
  bold: '700',     // Headings, primary text
}
```

### Line Heights
```javascript
const lineHeights = {
  tight: 1.25,   // Headings
  normal: 1.5,   // Body text
  relaxed: 1.75, // Paragraphs
}
```

### Text Styles
```javascript
const textStyles = {
  h1: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 1.25,
    color: '#34D399', // primary-400
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 1.25,
    color: '#34D399',
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 1.25,
    color: '#FFFFFF',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 1.5,
    color: '#D1D5DB', // gray-300
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 1.5,
    color: '#9CA3AF', // gray-400
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 1.25,
    color: '#D1D5DB', // gray-300
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 1.25,
    color: '#6B7280', // gray-500
  },
}
```

---

## 3. Spacing System

### Spacing Scale (8pt grid system)
```javascript
const spacing = {
  0: 0,
  1: 4,    // 0.25rem
  2: 8,    // 0.5rem
  3: 12,   // 0.75rem
  4: 16,   // 1rem
  5: 20,   // 1.25rem
  6: 24,   // 1.5rem
  8: 32,   // 2rem
  10: 40,  // 2.5rem
  12: 48,  // 3rem
  16: 64,  // 4rem
  20: 80,  // 5rem
}
```

### Component Spacing
```javascript
const componentSpacing = {
  inputPadding: { horizontal: 16, vertical: 12 },     // px-4 py-3
  buttonPadding: { horizontal: 24, vertical: 12 },    // px-6 py-3
  cardPadding: { horizontal: 32, vertical: 32 },      // p-8
  sectionGap: 24,   // gap-6
  formGap: 16,      // gap-4
  elementGap: 8,    // gap-2
}
```

---

## 4. Component Library

### Buttons

#### Primary Button
```javascript
const buttonPrimary = {
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 12, // rounded-xl
  backgroundColor: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',

  // Text style
  textColor: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',

  // States
  hover: {
    backgroundColor: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}
```

#### Secondary Button
```javascript
const buttonSecondary = {
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 12,
  backgroundColor: '#1F2937', // gray-800

  textColor: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',

  hover: {
    backgroundColor: '#374151', // gray-700
  },
}
```

#### Danger Button
```javascript
const buttonDanger = {
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8, // rounded-lg
  backgroundColor: 'rgba(239, 68, 68, 0.2)', // red-500/20

  textColor: '#F87171', // red-400
  fontSize: 14,
  fontWeight: '600',

  hover: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)', // red-500/30
  },
}
```

### Input Fields

#### Text Input
```javascript
const textInput = {
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 12, // rounded-xl
  backgroundColor: '#1F2937', // gray-800
  borderWidth: 1,
  borderColor: '#374151', // gray-700

  // Text style
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '400',
  placeholderColor: '#6B7280', // gray-500

  // States
  focus: {
    borderColor: '#10B981', // primary-500
    outlineWidth: 0,
  },
  error: {
    borderColor: '#EF4444', // red-500
  },
}
```

#### Phone Input (with prefix)
```javascript
const phoneInput = {
  container: {
    flexDirection: 'row-reverse', // RTL
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  prefix: {
    color: '#9CA3AF', // gray-400
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
}
```

#### Select/Dropdown
```javascript
const select = {
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 12,
  backgroundColor: '#1F2937',
  borderWidth: 1,
  borderColor: '#374151',

  color: '#FFFFFF',
  fontSize: 16,

  disabled: {
    opacity: 0.5,
  },
}
```

### Cards

#### Main Card
```javascript
const card = {
  backgroundColor: 'rgba(17, 24, 39, 0.5)', // gray-900/50
  backdropFilter: 'blur(12px)',
  borderRadius: 16, // rounded-2xl
  borderWidth: 1,
  borderColor: 'rgba(16, 185, 129, 0.2)', // primary-500/20
  padding: 32,
}
```

#### Section Card (Inner)
```javascript
const sectionCard = {
  backgroundColor: 'rgba(31, 41, 55, 0.3)', // gray-800/30
  borderRadius: 12, // rounded-xl
  padding: 24,
}
```

### Upload Component

#### Upload Zone
```javascript
const uploadZone = {
  container: {
    height: 128, // h-32 for small, h-48 for large
    borderRadius: 8, // rounded-lg
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#374151', // gray-700
    justifyContent: 'center',
    alignItems: 'center',
  },

  hover: {
    borderColor: '#10B981', // primary-500
  },

  icon: {
    size: 32, // w-8 h-8 for small, w-12 h-12 for large
    color: '#6B7280', // gray-500
    marginBottom: 8,
  },

  text: {
    fontSize: 14,
    color: '#9CA3AF', // gray-400
  },
}
```

#### Progress Bar
```javascript
const progressBar = {
  container: {
    height: 8, // h-2
    borderRadius: 9999, // rounded-full
    backgroundColor: '#374151', // gray-700
    overflow: 'hidden',
  },

  fill: {
    height: '100%',
    backgroundColor: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
    transition: 'width 300ms ease',
  },
}
```

### Step Progress Indicator

```javascript
const stepIndicator = {
  container: {
    flexDirection: 'row-reverse', // RTL
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepActive: {
    backgroundColor: '#10B981', // primary-500
  },

  stepInactive: {
    backgroundColor: '#374151', // gray-700
  },

  stepText: {
    fontSize: 16,
    fontWeight: '600',
  },

  stepTextActive: {
    color: '#FFFFFF',
  },

  stepTextInactive: {
    color: '#9CA3AF', // gray-400
  },

  connector: {
    width: 48, // w-12
    height: 4, // h-1
    backgroundColor: '#374151', // gray-700 (inactive)
    // backgroundColor: '#10B981', // primary-500 (active)
  },
}
```

### Pricing Plan Card

```javascript
const pricingCard = {
  container: {
    padding: 24,
    borderRadius: 12, // rounded-xl
    borderWidth: 2,
  },

  inactive: {
    borderColor: '#374151', // gray-700
    backgroundColor: 'rgba(31, 41, 55, 0.3)', // gray-800/30
  },

  active: {
    borderColor: '#10B981', // primary-500
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // primary-500/10
  },

  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999, // rounded-full
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // green-500/20
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34D399', // green-400
  },
}
```

### Status Badge

```javascript
const statusBadge = {
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
  },

  pending: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // primary-500/10
    borderColor: 'rgba(16, 185, 129, 0.3)', // primary-500/30
    textColor: '#6EE7B7', // primary-200
  },

  success: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)', // green-500/10
    borderColor: 'rgba(34, 197, 94, 0.3)', // green-500/30
    textColor: '#86EFAC', // green-200
  },

  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-500/10
    borderColor: 'rgba(239, 68, 68, 0.3)', // red-500/30
    textColor: '#FCA5A5', // red-200
  },
}
```

---

## 5. Border Radius Standards

```javascript
const borderRadius = {
  sm: 4,   // rounded-sm
  base: 8,  // rounded-lg
  md: 8,    // rounded-lg
  lg: 12,   // rounded-xl
  xl: 16,   // rounded-2xl
  full: 9999, // rounded-full
}
```

---

## 6. Shadows & Elevation

```javascript
const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },

  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 8,
  },
}
```

---

## 7. Icons

### Icon Sizes
```javascript
const iconSizes = {
  xs: 12,   // w-3 h-3
  sm: 16,   // w-4 h-4
  base: 20,  // w-5 h-5
  md: 24,    // w-6 h-6
  lg: 32,    // w-8 h-8
  xl: 48,    // w-12 h-12
  '2xl': 64, // w-16 h-16
  '3xl': 80, // w-20 h-20
}
```

### Icon Library
Use `lucide-react-native` or `react-native-vector-icons`:
- Store, User, MapPin, Upload, CreditCard, CheckCircle
- ArrowLeft, Shield, Building2, Phone, Mail, Clock
- AlertCircle, MessageCircle, Sparkles

---

## 8. Animations & Transitions

### Timing Functions
```javascript
const animations = {
  // Durations (ms)
  fast: 150,
  normal: 300,
  slow: 500,

  // Easing
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Spring configs
  spring: {
    damping: 15,
    stiffness: 150,
  },
}
```

### Common Animations

#### Fade In
```javascript
const fadeIn = {
  from: { opacity: 0 },
  to: { opacity: 1 },
  duration: 300,
}
```

#### Scale In
```javascript
const scaleIn = {
  from: { scale: 0.9, opacity: 0 },
  to: { scale: 1, opacity: 1 },
  duration: 300,
}
```

#### Slide Up
```javascript
const slideUp = {
  from: { translateY: 20, opacity: 0 },
  to: { translateY: 0, opacity: 1 },
  duration: 300,
}
```

---

## 9. Layout & Grid

### Screen Padding
```javascript
const screenPadding = {
  horizontal: 16, // px-4
  vertical: 48,    // py-12
}
```

### Container Max Width
```javascript
const containerMaxWidth = {
  sm: 640,  // max-w-sm
  md: 768,  // max-w-md
  lg: 1024, // max-w-lg
  xl: 1280, // max-w-xl
  '2xl': 1536, // max-w-2xl
  '4xl': 1792, // max-w-4xl
}
```

### Grid System
```javascript
const grid = {
  cols: {
    1: '100%',
    2: '50%',
    3: '33.333%',
    4: '25%',
  },
  gap: 16, // gap-4
}
```

---

## 10. Accessibility

### Touch Targets
```javascript
const touchTargets = {
  minimum: 44, // Minimum touch target size (44x44 dp)
  comfortable: 48, // Comfortable touch target
  button: { minWidth: 88, minHeight: 44 },
}
```

### Color Contrast
- Text on background: Minimum 4.5:1 ratio
- Large text (18pt+): Minimum 3:1 ratio
- UI components: Minimum 3:1 ratio

### Font Size Minimums
- Body text: 16sp minimum
- Secondary text: 14sp minimum
- Captions: 12sp minimum

---

## 11. React Native Implementation Examples

### Button Component
```javascript
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const PrimaryButton = ({ title, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={['#10B981', '#059669']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Input Component
```javascript
import { TextInput, View, Text, StyleSheet } from 'react-native';

const Input = ({ label, value, onChangeText, error, ...props }) => (
  <View style={styles.container}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={[styles.input, error && styles.inputError]}
      placeholderTextColor="#6B7280"
      {...props}
    />
    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    fontSize: 12,
    color: '#F87171',
    marginTop: 4,
  },
});
```

### Card Component
```javascript
import { View, StyleSheet } from 'react-native';
import { BlurView } from '@react-native-community/blur';

const Card = ({ children }) => (
  <View style={styles.cardContainer}>
    <BlurView style={styles.card} blurType="dark" blurAmount={10}>
      {children}
    </BlurView>
  </View>
);

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    padding: 32,
  },
});
```

---

## 12. RTL (Right-to-Left) Support

### Configuration
```javascript
import { I18nManager } from 'react-native';

// Enable RTL
I18nManager.forceRTL(true);
```

### RTL-Aware Styles
```javascript
const styles = StyleSheet.create({
  // Use start/end instead of left/right
  container: {
    paddingStart: 16,  // Will be right in RTL
    paddingEnd: 16,    // Will be left in RTL
  },

  // Flex direction
  row: {
    flexDirection: 'row-reverse', // For RTL layouts
  },
});
```

---

## 13. Theme Configuration File

### Complete Theme Object
```javascript
export const theme = {
  colors: {
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    secondary: '#F59E0B',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',

    background: '#030712',
    surface: '#111827',
    card: 'rgba(17, 24, 39, 0.5)',

    text: '#FFFFFF',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    textDisabled: '#6B7280',

    border: '#374151',
    borderLight: '#4B5563',

    input: '#1F2937',
    placeholder: '#6B7280',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

---

## 14. Usage Guidelines

### Do's
- ✅ Use the 8pt spacing grid consistently
- ✅ Maintain proper color contrast ratios
- ✅ Use gradient backgrounds for primary CTAs
- ✅ Support RTL layout for Arabic text
- ✅ Provide visual feedback for all interactions
- ✅ Use consistent border radius across components

### Don'ts
- ❌ Don't use arbitrary spacing values
- ❌ Don't mix light and dark theme elements
- ❌ Don't use less than 44dp for touch targets
- ❌ Don't use text smaller than 12sp
- ❌ Don't ignore error states in forms

---

## 15. Component States Reference

### Interactive States
```javascript
const componentStates = {
  default: {
    // Normal resting state
  },
  hover: {
    // Mouse/touch down (activeOpacity in React Native)
  },
  focus: {
    // Input focus or keyboard navigation
  },
  active: {
    // Selected or currently active
  },
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
  loading: {
    // Show loading indicator
  },
  error: {
    borderColor: '#EF4444',
  },
}
```

---

This design system ensures consistent, accessible, and beautiful UI across the Rimmarsa vendor mobile application while maintaining perfect alignment with the web platform's dark theme aesthetic.
