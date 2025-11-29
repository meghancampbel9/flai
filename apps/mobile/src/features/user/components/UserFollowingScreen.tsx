import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { userFollowingService, UserProfile } from '@/services/userFollowingService';
import { colors, spacing, typography } from '@/styles';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const UserFollowingScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string }>();
  const { user } = useAuth();
  
  // Use provided userId or fall back to current user
  const userId = params.userId || user?.id || '';
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadFollowing = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const response = await userFollowingService.getUserFollowing(userId, 20, currentOffset);
      
      if (reset) {
        setFollowing(response.following);
        setOffset(20);
      } else {
        setFollowing(prev => [...prev, ...response.following]);
        setOffset(prev => prev + 20);
      }
      
      setHasMore(response.has_more);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load following');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFollowing(true);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadFollowing(false);
    }
  };

  const handleUserPress = (userProfile: UserProfile) => {
    router.push(`/user-profile?userId=${userProfile.user_id}`);
  };

  const handleFollowToggle = async (user: UserProfile) => {
    try {
      if (user.is_following) {
        await userFollowingService.unfollowUser(user.user_id);
        setFollowing(prev => prev.map(following => 
          following.user_id === user.user_id 
            ? { ...following, is_following: false }
            : following
        ));
      } else {
        await userFollowingService.followUser(user.user_id);
        setFollowing(prev => prev.map(following => 
          following.user_id === user.user_id 
            ? { ...following, is_following: true }
            : following
        ));
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update follow status');
    }
  };

  const renderFollowingItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.userInfo}>
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={styles.username}>@{item.username}</Text>
          {item.display_name && (
            <Text style={styles.displayName}>{item.display_name}</Text>
          )}
          {item.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.followButton,
          item.is_following && styles.followingButton
        ]}
        onPress={() => handleFollowToggle(item)}
      >
        <Text style={styles.followButtonText}>
          {item.is_following ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>Not Following Anyone</Text>
      <Text style={styles.emptyStateText}>
        This user is not following anyone yet
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading || following.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  useEffect(() => {
    loadFollowing(true);
  }, [userId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Following</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={following}
        renderItem={renderFollowingItem}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  username: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  displayName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bio: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  followingButton: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followButtonText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});

export default UserFollowingScreen;
