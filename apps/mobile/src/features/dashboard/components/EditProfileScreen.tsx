import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { userService, UserProfile } from '@/features/auth/services/userService';
import { pinterestService } from '@/features/auth/services/pinterestService';
import { componentStyles, colors, typography, spacing } from '@/styles';
import { dashboardStyles } from '../styles';
import { authStyles } from '@/features/auth/styles';

export const EditProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [pinterestBoard, setPinterestBoard] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch current profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const profile = await userService.getUserProfile(user.id);
        setUserProfile(profile);
        setDisplayName(profile.display_name || '');
        setBio(profile.bio || '');
        setProfileImage(profile.avatar_url || null);
        setPinterestBoard(profile.pinterest_board_analyzed || '');
      } catch (error) {
        Alert.alert('Error', 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleChangePhoto = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access photos is required!');
        return;
      }

      // Show action sheet for photo options
      Alert.alert(
        'Edit Profile Photo',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.granted) {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ['images'],
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                });
                
                if (!result.canceled && result.assets[0]) {
                  setProfileImage(result.assets[0].uri);
                }
              }
            }
          },
          {
            text: 'Photo Library',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                setProfileImage(result.assets[0].uri);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      // Prepare update data - only include changed fields
      const updates: { display_name?: string; bio?: string; avatar_url?: string } = {};
      if (displayName.trim() !== (userProfile?.display_name || '')) {
        updates.display_name = displayName.trim();
      }
      if (bio.trim() !== (userProfile?.bio || '')) {
        updates.bio = bio.trim();
      }
      
      // Handle image upload if a new image was selected
      if (profileImage !== (userProfile?.avatar_url || null)) {
        if (profileImage && profileImage.startsWith('file://')) {
          setUploading(true);
          const uploadedImageUrl = await userService.uploadProfileImage(user.id, profileImage);
          updates.avatar_url = uploadedImageUrl;
          setUploading(false);
        } else {
          // handle the case where image was removed
          updates.avatar_url = profileImage || '';
        }
      }

      // Only make API call if there are actual changes
      if (Object.keys(updates).length > 0) {
        await userService.updateUserProfile(user.id, updates);
      }

      // Handle Pinterest board update if changed
      if (pinterestBoard.trim() !== (userProfile?.pinterest_board_analyzed || '')) {
        if (pinterestBoard.trim()) {
          // Construct full Pinterest URL
          const constructPinterestUrl = (input: string) => {
            if (input.startsWith('http')) {
              return input;
            }
            return `https://pinterest.com/${input}`;
          };
          const fullUrl = constructPinterestUrl(pinterestBoard.trim());
          
          // First update the Pinterest board URL
          await userService.updatePinterestBoard(user.id, fullUrl);
          // Then analyze the board
          setAnalyzing(true);
          try {
            const analysisResult = await pinterestService.analyzeBoard(fullUrl, user.id);
            if (analysisResult.success) {
              console.log('✅ Pinterest board analyzed successfully');
            } else {
              // Analysis failed but don't block the save
              console.warn('⚠️ Pinterest analysis failed:', analysisResult.message);
              Alert.alert(
                'Pinterest Analysis', 
                `Board updated but analysis failed: ${analysisResult.message}`,
                [{ text: 'OK' }]
              );
            }
          } catch (error) {
            console.error('❌ Pinterest analysis error:', error);
            Alert.alert(
              'Pinterest Analysis', 
              'Board updated but analysis failed. You can try again later.',
              [{ text: 'OK' }]
            );
          } finally {
            setAnalyzing(false);
          }
        }
      }
      
      // Navigate back after successful update
      router.replace('/dashboard/profile');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
      {/* Header */}
      <View style={dashboardStyles.editProfileHeader}>
        <TouchableOpacity onPress={handleCancel} style={dashboardStyles.headerButton}>
          <Text style={dashboardStyles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={dashboardStyles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[dashboardStyles.headerButton, { opacity: saving || uploading || analyzing ? 0.5 : 1 }]}
          disabled={saving || uploading || analyzing}
        >
          {saving || uploading || analyzing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[dashboardStyles.headerButtonText, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={dashboardStyles.editProfileContent}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.xl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Profile Picture Section */}
        <View style={dashboardStyles.editProfilePictureSection}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={dashboardStyles.profilePicture} />
          ) : (
            <View style={dashboardStyles.profilePicturePlaceholder}>
              <Ionicons name="person" size={40} color={colors.textSecondary} />
            </View>
          )}
          <TouchableOpacity style={dashboardStyles.changePhotoButton} onPress={handleChangePhoto}>
            <Text style={dashboardStyles.changePhotoText}>
              {profileImage ? 'Change Profile Photo' : 'Add Profile Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={dashboardStyles.editFormSection}>
          {/* Username (Read-only) */}
          <View style={dashboardStyles.fieldGroup}>
            <Text style={dashboardStyles.fieldLabel}>Username</Text>
            <View style={[authStyles.usernameInputContainer, { opacity: 0.6, backgroundColor: colors.backgroundSecondary, marginTop: 5, marginBottom: 5 }]}>
              <Text style={authStyles.usernamePrefix}>@</Text>
              <Text style={[authStyles.usernameInput, { color: colors.textSecondary }]}>
                {userProfile?.username || 'username'}
              </Text>
            </View>
          </View>

          {/* Display Name */}
          <View style={dashboardStyles.fieldGroup}>
            <Text style={dashboardStyles.fieldLabel}>Display Name</Text>
            <View style={[authStyles.usernameInputContainer, { marginTop: 5, marginBottom: 5 }]}>
              <TextInput
                style={authStyles.usernameInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your display name"
                placeholderTextColor={colors.textMuted}
                maxLength={50}
              />
            </View>
          </View>

          {/* Bio */}
          <View style={dashboardStyles.fieldGroup}>
            <Text style={dashboardStyles.fieldLabel}>Bio</Text>
            <View style={[authStyles.usernameInputContainer, { height: 100, alignItems: 'flex-start', paddingTop: spacing.md, marginTop: 5, marginBottom: 5 }]}>
              <TextInput
                style={[authStyles.usernameInput, { height: '100%', textAlignVertical: 'top' }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
            </View>
            <Text style={dashboardStyles.fieldHelper}>
              {bio.length}/200 characters
            </Text>
          </View>

          {/* Pinterest Board */}
          <View style={dashboardStyles.fieldGroup}>
            <Text style={dashboardStyles.fieldLabel}>Pinterest Board</Text>
            <View style={[authStyles.pinterestInputContainer, { marginTop: 5, marginBottom: 5 }]}>
              <Ionicons 
                name="logo-pinterest" 
                size={24} 
                color={colors.error} 
                style={authStyles.pinterestIcon} 
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={[authStyles.urlPrefix, { color: colors.textSecondary }]}>
                  pinterest.com/
                </Text>
                <TextInput
                  style={[authStyles.pinterestInput, { flex: 1, paddingLeft: 0 }]}
                  value={pinterestBoard.replace('https://pinterest.com/', '').replace('pinterest.com/', '')}
                  onChangeText={(text) => setPinterestBoard(text)}
                  placeholder="username/boardname"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <Text style={dashboardStyles.fieldHelper}>
              Link your Pinterest board for style analysis
            </Text>
          </View>

          {/* Phone (Read-only) */}
          <View style={dashboardStyles.fieldGroup}>
            <Text style={dashboardStyles.fieldLabel}>Phone</Text>
            <View style={[authStyles.usernameInputContainer, { opacity: 0.6, backgroundColor: colors.backgroundSecondary, marginTop: 5, marginBottom: 5 }]}>
              <Text style={[authStyles.usernameInput, { color: colors.textSecondary }]}>
                {user?.phone || 'Not available'}
              </Text>
            </View>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}; 