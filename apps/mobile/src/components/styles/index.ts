import { StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing'; 
import { typography } from '../../styles/typography';

export const uiStyles = StyleSheet.create({
  // Button styles
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLarge: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
  primaryButtonTextDisabled: {
    color: colors.textSecondary,
  },
}); 