import { ViewStyle, TextStyle } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export const componentStyles = {
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
  } as ViewStyle,
  
  // Header styles
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  } as ViewStyle,
  
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  // Button styles
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.buttonVertical,
    paddingHorizontal: 32,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 160,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  
  primaryButtonLarge: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.buttonVertical,
    paddingHorizontal: 48,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 200,
  } as ViewStyle,
  
  primaryButtonDisabled: {
    backgroundColor: colors.disabled,
  } as ViewStyle,
  
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  } as ViewStyle,
  
  primaryButtonText: {
    ...typography.button,
    color: colors.background,
  } as TextStyle,
  
  primaryButtonTextDisabled: {
    color: colors.textMuted,
  } as TextStyle,
  
  // Layout styles
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  spaceBetweenContainer: {
    flex: 1,
    justifyContent: 'space-between',
  } as ViewStyle,
  
  bottomSection: {
    paddingBottom: spacing.sectionBottom,
    paddingHorizontal: spacing.screenHorizontal,
    alignItems: 'center',
  } as ViewStyle,
  
  // Title styles
  screenTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.xxxxxl,
  } as TextStyle,
  
  screenSubtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
    marginBottom: spacing.xxxxl,
  } as TextStyle,
  
  // Shadow styles
  cardShadow: {
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,
} as const; 