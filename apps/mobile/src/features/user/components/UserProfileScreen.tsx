import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { userFollowingService, UserProfile } from '@/services/userFollowingService';
import { colors, spacing, typography } from '@/styles';
import { dashboardStyles } from '../../dashboard/styles';

export const UserProfileScreen: React.FC = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const loadUserProfile = async () => {
    try {
      const profile = await userFollowingService.getUserProfile(userId);
      setUserProfile(profile);
      setIsFollowing(profile.is_following);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUserProfile();
    setIsRefreshing(false);
  };

  const handleFollowToggle = async () => {
    if (!userProfile || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await userFollowingService.unfollowUser(userId);
        setIsFollowing(false);
        setUserProfile(prev => prev ? {
          ...prev,
          followers_count: Math.max(0, prev.followers_count - 1),
          is_following: false
        } : null);
      } else {
        await userFollowingService.followUser(userId);
        setIsFollowing(true);
        setUserProfile(prev => prev ? {
          ...prev,
          followers_count: prev.followers_count + 1,
          is_following: true
        } : null);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleFollowersPress = () => {
    router.push(`/user-followers?userId=${userId}`);
  };

  const handleFollowingPress = () => {
    router.push(`/user-following?userId=${userId}`);
  };

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.errorTitle}>User Not Found</Text>
          <Text style={styles.errorText}>
            This user profile could not be found or may have been deleted.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{userProfile.username}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Profile Info Section */}
        <View style={dashboardStyles.profileInfoSection}>
          {/* Profile Picture and Stats */}
          <View style={dashboardStyles.profileStatsRow}>
            {/* Profile Picture */}
            <View style={dashboardStyles.profilePictureContainer}>
              {userProfile.avatar_url ? (
                <Image 
                  source={{ uri: userProfile.avatar_url }} 
                  style={dashboardStyles.profilePicture}
                />
              ) : (
                <View style={dashboardStyles.profilePicturePlaceholder}>
                  <Ionicons name="person" size={40} color={colors.textSecondary} />
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={dashboardStyles.statsContainer}>
              <View style={dashboardStyles.statItem}>
                <Text style={dashboardStyles.statNumber}>0</Text>
                <Text style={dashboardStyles.statLabel}>Items</Text>
              </View>
              <TouchableOpacity
                style={dashboardStyles.statItem}
                onPress={handleFollowingPress}
              >
                <Text style={dashboardStyles.statNumber}>{userProfile.following_count}</Text>
                <Text style={dashboardStyles.statLabel}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={dashboardStyles.statItem}
                onPress={handleFollowersPress}
              >
                <Text style={dashboardStyles.statNumber}>{userProfile.followers_count}</Text>
                <Text style={dashboardStyles.statLabel}>Followers</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Display Name and Bio */}
          <View style={dashboardStyles.profileTextInfo}>
            <Text style={dashboardStyles.profileUsername}>@{userProfile.username}</Text>
            {userProfile.display_name && (
              <Text style={dashboardStyles.displayName}>{userProfile.display_name}</Text>
            )}
            {userProfile.bio && (
              <Text style={dashboardStyles.bio}>{userProfile.bio}</Text>
            )}
          </View>

          {/* Follow Button */}
          <View style={dashboardStyles.actionButtons}>
            <TouchableOpacity
              style={[
                dashboardStyles.editButton,
                isFollowing && dashboardStyles.shareButton
              ]}
              onPress={handleFollowToggle}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons
                    name={isFollowing ? "checkmark" : "add"}
                    size={16}
                    color={colors.text}
                  />
                  <Text style={dashboardStyles.editButtonText}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  backButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});

export default UserProfileScreen;
