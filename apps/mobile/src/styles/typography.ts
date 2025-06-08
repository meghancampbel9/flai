import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 40,
  } as TextStyle,
  
  h2: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 32,
  } as TextStyle,
  
  h3: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 28,
  } as TextStyle,
  
  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 24,
  } as TextStyle,
  
  bodySecondary: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 24,
  } as TextStyle,
  
  // Button text
  button: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  } as TextStyle,
  
  // Small text
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  } as TextStyle,
  
  // Input text
  input: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.text,
  } as TextStyle,
  
  // OTP text
  otp: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
} as const;

export type TypographyKey = keyof typeof typography; 