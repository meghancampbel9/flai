import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, typography } from '@/styles';

const { width, height } = Dimensions.get('window');

export const landingStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  
  // Header styles
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  brandName: {
    ...typography.h1,
    color: colors.primary,
    letterSpacing: 1,
  },
  
  // Hero section styles
  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  heroTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.text,
  },
  heroSubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
  
  // Video styles
  videoContainer: {
    width: width * 0.8,
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroVideo: {
    width: 300,
    height: 510,
  },
  
  // Bottom section styles
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxxl,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  

  
    // Terms and links
  termsText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    alignSelf: 'center',
    marginHorizontal: 10,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '500',
  },
  
  // Feature highlight styles
  featureContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
    color: colors.text,
  },
  featureDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  
  // Call to action styles
  ctaContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  ctaTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.text,
  },
  ctaDescription: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
}); 