import { StyleSheet, Platform, Dimensions } from 'react-native';
import { colors, spacing, typography } from '@/styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Product details
export const productDetailStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    errorText: {
      ...typography.h3,
      color: colors.textSecondary,
      marginTop: spacing.md,
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
    backButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      backgroundColor: colors.primary,
      borderRadius: spacing.borderRadius.xl,
    },
    backButtonText: {
      ...typography.body,
      color: colors.background,
      fontWeight: '600',
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    headerButton: {
      position: 'relative',
    },
    imageContainer: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    imageLoadingContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      zIndex: 1,
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    bottomPanel: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: screenHeight - 100,
      backgroundColor: colors.background,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      ...Platform.select({
        ios: {
      shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
        },
        android: {
          elevation: 20,
        },
      }),
    },
    handleContainer: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    handle: {
      width: 36,
      height: 5,
      backgroundColor: colors.border,
      borderRadius: spacing.borderRadius.xl,
    },
    panelScrollView: {
      flex: 1,
    },
    panelContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl + 50,
    },
    productHeader: {
      marginBottom: spacing.lg,
    },
    productInfo: {
      marginBottom: 1,
    },
    brandName: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 1,
    },
    productName: {
      ...typography.h2,
      color: colors.text,
      fontWeight: '400',
      fontSize: 16,
      marginBottom: 1,
    },
    pricingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    price: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
    },
    salePrice: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '700',
    },
    originalPrice: {
      ...typography.body,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    discountText: {
      ...typography.body,
      color: colors.error,
      fontWeight: '600',
    },
    quickActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xl,
      alignItems: 'center',
    },
    addToCartButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.text,
      paddingVertical: spacing.md,
      borderRadius: 0,
    },
    addToCartText: {
      ...typography.body,
      color: colors.background,
      fontWeight: '600',
      letterSpacing: 1,
    },
    wishlistButton: {
      width: 'auto',
      height: 48,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    wishlistButtonText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      letterSpacing: 1,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography.caption,
      color: colors.text,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.md,
    },
    sizeSelector: {
      flexDirection: 'row',
      marginHorizontal: -spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    sizeOption: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: spacing.borderRadius.sm,
      marginRight: spacing.sm,
    },
    sizeText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '500',
    },
    description: {
      ...typography.body,
      color: colors.text,
      lineHeight: 24,
    },
    shippingInfo: {
      gap: spacing.sm,
    },
    shippingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    shippingText: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    reviewsSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    ratingText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    reviewCount: {
      ...typography.body,
      color: colors.textSecondary,
    },
    viewReviewsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    viewReviewsText: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
  }); 