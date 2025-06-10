import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert, Share, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { userService, UserProfile } from '@/features/auth/services/userService';
import { colors, typography, spacing } from '@/styles';
import { dashboardStyles } from '../styles';

type TabType = 'closet' | 'wishlist';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('closet');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Mock data for now - replace with actual data later
  const [closetItems] = useState([]);
  const [wishlistItems] = useState([]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const profile = await userService.getUserProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const handleSettingsPress = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const handleCloseSettingsMenu = () => {
    if (showSettingsMenu) {
      setShowSettingsMenu(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleShareProfile = async () => {
    try {
      const shareContent = {
        message: `Check out ${userProfile?.display_name || userProfile?.username || 'this'}'s profile on FLAI!`,
        url: `https://flai.app/profile/${userProfile?.username}`, // TODO: Replace with actual app URL
      };

      await Share.share(shareContent);
    } catch (error) {
      Alert.alert('Error', 'Failed to share profile. Please try again.');
    }
  };

  const renderHeader = () => (
    <View style={dashboardStyles.profileHeaderContainer}>
      {/* Top Bar with Settings */}
      <View style={dashboardStyles.profileTopBar}>
        <Text style={dashboardStyles.profileUsername}>
          {userProfile?.username || 'Username'}
        </Text>
        <TouchableOpacity onPress={handleSettingsPress} style={dashboardStyles.settingsButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Profile Info Section */}
      <View style={dashboardStyles.profileInfoSection}>
        {/* Profile Picture and Stats */}
        <View style={dashboardStyles.profileStatsRow}>
          {/* Profile Picture */}
          <View style={dashboardStyles.profilePictureContainer}>
            {userProfile?.avatar_url ? (
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
              <Text style={dashboardStyles.statNumber}>{closetItems.length}</Text>
              <Text style={dashboardStyles.statLabel}>Items</Text>
            </View>
            <View style={dashboardStyles.statItem}>
              <Text style={dashboardStyles.statNumber}>0</Text>
              <Text style={dashboardStyles.statLabel}>Following</Text>
            </View>
            <View style={dashboardStyles.statItem}>
              <Text style={dashboardStyles.statNumber}>0</Text>
              <Text style={dashboardStyles.statLabel}>Followers</Text>
            </View>
          </View>
        </View>

        {/* Display Name and Bio */}
        <View style={dashboardStyles.profileTextInfo}>
          {userProfile?.display_name && (
            <Text style={dashboardStyles.displayName}>{userProfile.display_name}</Text>
          )}
          {userProfile?.bio && (
            <Text style={dashboardStyles.bio}>{userProfile.bio}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={dashboardStyles.actionButtons}>
          <TouchableOpacity style={dashboardStyles.editButton} onPress={handleEditProfile}>
            <Text style={dashboardStyles.editButtonText}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dashboardStyles.shareButton} onPress={handleShareProfile}>
            <Text style={dashboardStyles.shareButtonText}>Share profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={dashboardStyles.tabContainer}>
      <TouchableOpacity
        style={[dashboardStyles.tab, activeTab === 'closet' && dashboardStyles.activeTab]}
        onPress={() => setActiveTab('closet')}
      >
        <Ionicons 
          name="grid-outline" 
          size={24} 
          color={activeTab === 'closet' ? colors.text : colors.textSecondary} 
        />
        <Text style={[
          dashboardStyles.tabText, 
          activeTab === 'closet' && dashboardStyles.activeTabText
        ]}>
          Closet
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[dashboardStyles.tab, activeTab === 'wishlist' && dashboardStyles.activeTab]}
        onPress={() => setActiveTab('wishlist')}
      >
        <Ionicons 
          name="heart-outline" 
          size={24} 
          color={activeTab === 'wishlist' ? colors.text : colors.textSecondary} 
        />
        <Text style={[
          dashboardStyles.tabText, 
          activeTab === 'wishlist' && dashboardStyles.activeTabText
        ]}>
          Wishlist
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderGrid = () => {
    const items = activeTab === 'closet' ? closetItems : wishlistItems;
    
    if (items.length === 0) {
      return (
        <View style={dashboardStyles.emptyGridState}>
          <Ionicons 
            name={activeTab === 'closet' ? 'shirt-outline' : 'heart-outline'} 
            size={60} 
            color={colors.textSecondary} 
          />
          <Text style={dashboardStyles.emptyGridTitle}>
            {activeTab === 'closet' ? 'No items in your closet' : 'No items in your wishlist'}
          </Text>
        </View>
      );
    }

    // TODO: Implement actual grid of items
    return (
      <View style={dashboardStyles.grid}>
        {/* Grid items will go here */}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={dashboardStyles.screenContainer}>
        <View style={[dashboardStyles.contentContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.body, { marginTop: spacing.md, color: colors.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dashboardStyles.screenContainer}>
      <ScrollView style={dashboardStyles.profileContainer} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderTabs()}
        {renderGrid()}
      </ScrollView>

      {/* Settings Menu Modal */}
      <Modal
        visible={showSettingsMenu}
        transparent
        animationType="none"
        onRequestClose={handleCloseSettingsMenu}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}
          onPress={handleCloseSettingsMenu}
        >
          <View style={[dashboardStyles.settingsMenu, { top: 100, right: 20 }]}>
            <TouchableOpacity 
              style={dashboardStyles.settingsMenuItem}
              onPress={() => {
                router.push('/account-settings');
                setShowSettingsMenu(false);
              }}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text} />
              <Text style={dashboardStyles.settingsMenuText}>Account Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={dashboardStyles.settingsMenuItem}
              onPress={() => {
                handleSignOut();
                setShowSettingsMenu(false);
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[dashboardStyles.settingsMenuText, { color: colors.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}; 