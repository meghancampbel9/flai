import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, PressableStateCallbackType, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { userService, UserProfile, StylePreference } from '@/features/auth/services/userService';
import { pinterestService } from '@/features/auth/services/pinterestService';
import { componentStyles, colors, typography, spacing } from '@/styles';
import { dashboardStyles } from '../styles';
import { authStyles } from '@/features/auth/styles';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stylePreferences, setStylePreferences] = useState<StylePreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingPinterest, setIsEditingPinterest] = useState(false);
  const [newPinterestUrl, setNewPinterestUrl] = useState('');
  const [isUpdatingPinterest, setIsUpdatingPinterest] = useState(false);
  const [pinterestError, setPinterestError] = useState('');

  // Fetch user profile and style preferences
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        console.log('📡 Fetching user profile and style preferences...');
        const profile = await userService.getUserProfile(user.id);
        setUserProfile(profile);
        console.log('✅ User profile fetched:', profile.username);
        
        // Fetch style preferences if user has completed onboarding
        if (profile.onboarding_completed) {
          try {
            const preferences = await userService.getUserStylePreferences(user.id);
            setStylePreferences(preferences);
            console.log('✅ Style preferences fetched:', preferences.length, 'preferences');
          } catch (error) {
            console.log('ℹ️ No style preferences found (this is normal for new users)');
            setStylePreferences([]);
          }
        }
        
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
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

  const validatePinterestUrl = (url: string): boolean => {
    if (!url.trim()) {
      setPinterestError('Please enter a Pinterest board URL');
      return false;
    }
    const trimmed = url.trim();
    // Allow both full URLs and username/boardname format
    const userBoardRegex = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?$/;
    const fullUrlRegex = /^https?:\/\/(www\.)?(pinterest\.(com|ca|co\.uk|fr|de|es|it|jp|au)|pin\.it)\/[a-zA-Z0-9_\/-]+$/;
    if (!userBoardRegex.test(trimmed) && !fullUrlRegex.test(trimmed)) {
      if (trimmed.includes('/')) {
        setPinterestError('Format should be: username/boardname or full Pinterest URL');
      } else {
        setPinterestError('Please include both username and board name: username/boardname');
      }
      return false;
    }
    setPinterestError('');
    return true;
  };

  const constructPinterestUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    // If user enters full URL, use as-is
    if (trimmed.startsWith('http')) {
      return trimmed;
    }
    // Otherwise, prepend pinterest.com/
    return `https://pinterest.com/${trimmed}`;
  };

  const handleEditPinterest = () => {
    if (userProfile?.pinterest_board_analyzed) {
      // Pre-fill with current board URL, but make it user-friendly
      const currentUrl = userProfile.pinterest_board_analyzed;
      if (currentUrl.startsWith('https://pinterest.com/')) {
        // Convert full URL back to username/boardname format for easier editing
        const pathMatch = currentUrl.match(/pinterest\.com[^/]*\/([^/]+\/[^/?]+)/);
        setNewPinterestUrl(pathMatch ? pathMatch[1] : currentUrl);
      } else {
        setNewPinterestUrl(currentUrl);
      }
    } else {
      setNewPinterestUrl('');
    }
    setIsEditingPinterest(true);
    setPinterestError('');
  };

  const handleCancelEdit = () => {
    setIsEditingPinterest(false);
    setNewPinterestUrl('');
    setPinterestError('');
  };

  const handleUpdatePinterest = async () => {
    if (!user?.id || !newPinterestUrl.trim()) return;
    if (!validatePinterestUrl(newPinterestUrl)) {
      return;
    }
    setIsUpdatingPinterest(true);
    try {
      const fullUrl = constructPinterestUrl(newPinterestUrl);
      console.log('📌 Updating Pinterest board to:', fullUrl);
      
      // First, analyze the new board
      console.log('🎨 Analyzing new Pinterest board...');
      const analysisResult = await pinterestService.analyzeBoard(fullUrl, user.id);
      
      if (!analysisResult.success) {
        Alert.alert('Analysis Failed', analysisResult.message || 'Failed to analyze the Pinterest board. Please check the URL and try again.');
        return;
      }
      
      // If analysis succeeded, update the user profile
      console.log('💾 Updating user profile with new Pinterest board...');
      await userService.updatePinterestBoard(user.id, fullUrl);
      
      // Refresh user data to show updated information
      const updatedProfile = await userService.getUserProfile(user.id);
      setUserProfile(updatedProfile);
      
      // Refresh style preferences
      const updatedPreferences = await userService.getUserStylePreferences(user.id);
      setStylePreferences(updatedPreferences);
      
      setIsEditingPinterest(false);
      setNewPinterestUrl('');
      setPinterestError('');
      
      Alert.alert(
        'Success!', 
        'Your Pinterest board has been updated and re-analyzed. Your new style preferences are now available!',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Error updating Pinterest board:', error);
      Alert.alert('Error', 'Failed to update Pinterest board. Please try again.');
    } finally {
      setIsUpdatingPinterest(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
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
      <ScrollView style={dashboardStyles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={dashboardStyles.sectionTitle}>Profile</Text>
        
        {userProfile && (
          <>
            {/* Basic Profile Info */}
            <View style={dashboardStyles.card}>
              <Text style={typography.caption}>Username:</Text>
              <Text style={dashboardStyles.cardContent}>@{userProfile.username}</Text>
              
              {userProfile.display_name && (
                <>
                  <Text style={[typography.caption, { marginTop: spacing.md }]}>Display Name:</Text>
                  <Text style={dashboardStyles.cardContent}>{userProfile.display_name}</Text>
                </>
              )}
              <Text style={[typography.caption, { marginTop: spacing.md }]}>Phone:</Text>
              <Text style={dashboardStyles.cardContent}>{user?.phone || 'Not available'}</Text>
            </View>

            {/* Pinterest Board Section */}
            <View style={dashboardStyles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={typography.caption}>Pinterest Board:</Text>
                {userProfile.pinterest_board_analyzed && !isEditingPinterest && (
                  <Pressable onPress={handleEditPinterest} style={{ padding: spacing.xs }}>
                    <Ionicons name="pencil" size={18} color={colors.primary} />
                  </Pressable>
                )}
              </View>
              
              {isEditingPinterest ? (
                <View style={{ marginTop: spacing.sm }}>
                  <View style={authStyles.pinterestInputContainer}>
                    <Ionicons name="logo-pinterest" size={20} color={colors.error} style={authStyles.pinterestIcon} />
                    <Text style={authStyles.urlPrefix}>pinterest.com/</Text>
                    <TextInput
                      style={authStyles.pinterestInput}
                      value={newPinterestUrl}
                      onChangeText={(text) => {
                        setNewPinterestUrl(text);
                        setPinterestError('');
                      }}
                      placeholder="username/boardname"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  
                  {pinterestError ? (
                    <Text style={authStyles.pinterestError}>
                      {pinterestError}
                    </Text>
                  ) : null}
                  
                  <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm }}>
                    <Pressable
                      style={[componentStyles.primaryButton, { flex: 1, backgroundColor: colors.backgroundSecondary }]}
                      onPress={handleCancelEdit}
                      disabled={isUpdatingPinterest}
                    >
                      <Text style={[componentStyles.primaryButtonText, { color: colors.text }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[componentStyles.primaryButton, { flex: 1, opacity: isUpdatingPinterest ? 0.7 : 1 }]}
                      onPress={handleUpdatePinterest}
                      disabled={isUpdatingPinterest || !newPinterestUrl.trim()}
                    >
                      {isUpdatingPinterest ? (
                        <ActivityIndicator size="small" color={colors.background} />
                      ) : (
                        <Text style={componentStyles.primaryButtonText}>Update</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={{ marginTop: spacing.sm }}>
                  {userProfile.pinterest_board_analyzed ? (
                    <Text style={dashboardStyles.cardContent}>{userProfile.pinterest_board_analyzed}</Text>
                  ) : (
                    <>
                      <Text style={[dashboardStyles.cardContent, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                        No Pinterest board linked
                      </Text>
                      <Pressable
                        style={[componentStyles.primaryButton, { marginTop: spacing.md, backgroundColor: colors.backgroundSecondary }]}
                        onPress={handleEditPinterest}
                      >
                        <Text style={[componentStyles.primaryButtonText, { color: colors.text }]}>Add Pinterest Board</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        <Pressable
          style={({ pressed }: PressableStateCallbackType) => [
            dashboardStyles.dangerButton,
            pressed && dashboardStyles.dangerButtonPressed,
            { marginTop: spacing.xl, marginBottom: spacing.xxl }
          ]}
          onPress={handleSignOut}
        >
          <Text style={dashboardStyles.dangerButtonText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

 