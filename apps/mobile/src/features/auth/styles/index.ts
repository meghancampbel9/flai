import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/styles';

export const authStyles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxxxl,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderRadius: spacing.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInputEmpty: {
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  otpInputFilled: {
    borderColor: colors.borderFocus,
    backgroundColor: colors.background,
  },
  otpInputDisabled: {
    opacity: 0.6,
  },
  
  // Hidden input for auto-fill
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  
  // Resend code section
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxxxl,
  },
  resendText: {
    ...typography.bodySecondary,
  },
  resendButton: {
    ...typography.body,
    color: colors.info,
    fontWeight: '600',
  },
  
  // Phone input styles
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    marginBottom: spacing.xl,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
    paddingRight: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  countryCodeText: {
    ...typography.input,
    marginRight: spacing.xs,
  },
  phoneInput: {
    ...typography.input,
    flex: 1,
    marginLeft: spacing.sm,
    padding: 0,
  },
  
  // Country picker styles
  countryPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  countryPickerDropdown: {
    position: 'absolute',
    top: 140,
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadius.md,
    maxHeight: 250,
    zIndex: 1000,
  },
  countryPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryPickerItemSelected: {
    backgroundColor: colors.backgroundSecondary,
  },
  countryPickerFlag: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  countryPickerName: {
    ...typography.caption,
    flex: 1,
    color: colors.text,
  },
  countryPickerCode: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  
  // Welcome screen styles
  welcomeContainer: {
    flex: 1,
  },
  welcomeContent: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  welcomeTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xxxl,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    height: 50,
  },
  usernamePrefix: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  usernameInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
    margin: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  usernameStatusIcon: {
    marginLeft: spacing.xs,
    width: 24,
    alignItems: 'center',
  },
  usernameError: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  usernameSuccess: {
    ...typography.caption,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  suggestionsButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  suggestionsButtonText: {
    ...typography.caption,
    color: colors.info,
    fontWeight: '600',
  },

  // Pinterest input styles
  pinterestInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xxxl,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    height: 50,
  },
  pinterestIcon: {
    marginRight: spacing.md,
  },
  urlPrefix: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
    marginRight: spacing.xs,
  },
  pinterestInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
    margin: 0,
  },
  pinterestError: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  pinterestHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  pinterestHelpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Pinterest analysis results styles
  analysisResults: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  analysisTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  // Shopping Preference Screen styles
  preferencesContainer: {
    gap: spacing.md,
  },
  preferenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.background,
  },
  preferenceOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  preferenceOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceOptionText: {
    ...typography.h3,
    color: colors.text,
    marginLeft: spacing.lg,
    fontWeight: '500',
  },
  preferenceOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  preferenceSelectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceSelectionIndicatorSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  analysisDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  analysisSection: {
    marginBottom: spacing.md,
  },
  analysisSectionTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  keywordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  keywordTag: {
    backgroundColor: colors.info + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.info + '40',
  },
  keywordText: {
    ...typography.caption,
    color: colors.info,
    fontWeight: '500',
  },
  colorTag: {
    backgroundColor: colors.textSecondary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.textSecondary + '40',
  },
  colorText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
}); 