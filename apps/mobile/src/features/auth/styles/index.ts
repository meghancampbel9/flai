import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/styles';

export const authStyles = StyleSheet.create({
  // OTP Input styles
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
}); 