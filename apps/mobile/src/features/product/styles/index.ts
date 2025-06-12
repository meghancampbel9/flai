import { StyleSheet, Dimensions, Platform } from 'react-native';
import { colors, typography, spacing } from '@/styles';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const productStyles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 210,
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
    resizeMode: 'cover',
  },
  productDetailImage: {
    width: '80%',
    aspectRatio: 1,
    resizeMode: 'contain',
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
    flex: 1,
    flexDirection: 'column',
    padding: spacing.sm,
  },
  productInfoGrow: {
    flex: 1,
  },
  productBrandName: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  productName: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 16,
  },
  productPricingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 'auto',
  },
  productPrice: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 12,
  },
  productSalePrice: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 12,
    color: colors.error,
  },
  productOriginalPrice: {
    ...typography.body,
    fontWeight: 'normal',
    fontSize: 12,
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

  // ProductCard styles
  productCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#fff',
    maxWidth: (screenWidth - spacing.lg * 2 - 24) / 3,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.backgroundSecondary,
    overflow: 'hidden',
  },
  brandName: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 1,
  },
  productDetailName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 2,
  },
  pricingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // ProductGrid styles
  productGridContainer: {
    flex: 1,
  },
  productGridContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  productGridRow: {
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  productGridEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxxl,
    minHeight: 300,
  },
  productGridEmptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  productGridEmptyMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  productGridLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  productGridLoadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
}); 