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
  profileContainer: {
    flex: 1,
  },
  profileHeaderContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileUsername: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '600',
  },
  settingsButton: {
    padding: spacing.xs,
  },
  settingsMenu: {
    position: 'absolute',
    top: 50,
    right: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  settingsMenuText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  profileInfoSection: {
    paddingVertical: spacing.md,
  },
  profileStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profilePictureContainer: {
    marginRight: spacing.xl,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profilePicturePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  profileTextInfo: {
    marginBottom: spacing.lg,
  },
  displayName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  bio: {
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.borderRadius.sm,
    alignItems: 'center',
  },
  editButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.borderRadius.sm,
    alignItems: 'center',
  },
  shareButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.text,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.text,
  },
  grid: {
    flex: 1,
    padding: spacing.lg,
  },
  gridWrapper: {
    paddingTop: spacing.md,
  },
  emptyGridState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxxl,
  },
  emptyGridTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyGridMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Edit Profile Screen styles
  editProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  editProfileContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  editProfilePictureSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  changePhotoButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  changePhotoText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  editFormSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.sm,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.text,
    textAlignVertical: 'center',
  },
  textInputText: {
    ...typography.body,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  fieldHelper: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Account Settings Screen styles
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  settingsContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  settingsSection: {
    paddingVertical: spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemRight: {
    marginLeft: spacing.md,
  },
  settingIcon: {
    marginRight: spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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

  // HomeScreen styles
  homeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
  clearIcon: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
}); 

export const cartStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  header: { paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  closeButton: { fontSize: 14, color: '#333', paddingBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  list: { flex: 1 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  listHeaderText: { color: '#888', fontSize: 12 },
  itemContainer: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemImage: { width: 80, height: 120, marginRight: 15 },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemBrand: { fontWeight: 'bold', fontSize: 14 },
  itemName: { fontSize: 14, color: '#333', marginVertical: 2 },
  itemSize: { fontSize: 14, color: '#888' },
  itemDiscount: { fontSize: 14, color: '#D9534F', marginVertical: 4 },
  itemActionLink: { fontSize: 12, color: '#888', textDecorationLine: 'underline', marginTop: 'auto' },
  itemPriceContainer: { alignItems: 'flex-end', justifyContent: 'space-between' },
  itemPrice: { fontSize: 14, fontWeight: 'bold' },
  itemOriginalPrice: { fontSize: 12, color: '#888', textDecorationLine: 'line-through' },
  removeLink: { textAlign: 'right' },
  summaryContainer: { padding: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 14, color: '#333' },
  summaryValue: { fontSize: 14, fontWeight: 'bold' },
  summaryMuted: { fontSize: 14, color: '#888' },
  totalRow: { paddingTop: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderTopWidth: 1, borderTopColor: '#ccc' },
  footerLabel: { fontSize: 12, color: '#888' },
  footerTotal: { fontSize: 20, fontWeight: 'bold' },
  checkoutButton: { backgroundColor: '#000', paddingVertical: 15, paddingHorizontal: 30 },
  checkoutButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyText: { marginTop: 20, fontSize: 16, color: '#888' },
}); 