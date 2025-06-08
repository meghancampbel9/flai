import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/styles';

export const dashboardStyles = StyleSheet.create({
  // Screen container styles
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Content area styles
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  
  // Section styles
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.bodySecondary,
    marginBottom: spacing.lg,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  cardContent: {
    ...typography.body,
    color: colors.textSecondary,
  },
  
  // List styles
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  listItemSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  
  // Empty state styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.textSecondary,
  },
  emptyStateMessage: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  
  // Profile specific styles
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.body,
    color: colors.textSecondary,
  },
  
  // Button styles
  dangerButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
  },
  dangerButtonPressed: {
    opacity: 0.8,
  },
  dangerButtonText: {
    color: colors.background,
    ...typography.body,
    fontWeight: '600',
  },
}); 