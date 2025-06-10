import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { userService, UserProfile } from '@/features/auth/services/userService';
import { componentStyles, colors, typography, spacing } from '@/styles';
import { dashboardStyles } from '../styles';

export const EditProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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
        'Change Profile Photo',
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
      
      // Navigate back after successful update
      router.replace('/dashboard/profile');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
      setUploading(false);
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
          style={[dashboardStyles.headerButton, { opacity: saving || uploading ? 0.5 : 1 }]}
          disabled={saving || uploading}
        >
          {saving || uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[dashboardStyles.headerButtonText, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={dashboardStyles.editProfileContent}>
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
            <View style={[dashboardStyles.textInput, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[dashboardStyles.textInputText, { color: colors.textSecondary }]}>
                @{userProfile?.username || 'username'}
              </Text>
            </View>
          </View>

          {/* Display Name */}
          <View style={dashboardStyles.fieldGroup}>
            <Text style={dashboardStyles.fieldLabel}>Display Name</Text>
            <TextInput
              style={dashboardStyles.textInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
              placeholderTextColor={colors.textSecondary}
              maxLength={50}
            />
            <Text style={dashboardStyles.fieldHelper}>
              Your display name appears on your profile
            </Text>
          </View>

          {/* Bio */}
          <View style={dashboardStyles.fieldGroup}>
            <Text style={dashboardStyles.fieldLabel}>Bio</Text>
            <TextInput
              style={[dashboardStyles.textInput, dashboardStyles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={dashboardStyles.fieldHelper}>
              {bio.length}/200 characters
            </Text>
          </View>

          {/* Phone (Read-only) */}
          <View style={dashboardStyles.fieldGroup}>
            <Text style={dashboardStyles.fieldLabel}>Phone</Text>
            <View style={[dashboardStyles.textInput, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[dashboardStyles.textInputText, { color: colors.textSecondary }]}>
                {user?.phone || 'Not available'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}; 