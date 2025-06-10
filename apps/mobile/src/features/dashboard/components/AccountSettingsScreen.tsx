import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { colors, typography, spacing } from '@/styles';
import { dashboardStyles } from '../styles';

export const AccountSettingsScreen: React.FC = () => {
  const { signOut } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);

  const handleBack = () => {
    router.back();
  };

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Delete Account', 'Account deletion functionality coming soon!');
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightContent?: React.ReactNode,
    destructive?: boolean
  ) => (
    <TouchableOpacity
      style={dashboardStyles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={dashboardStyles.settingItemLeft}>
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={destructive ? colors.error : colors.text} 
          style={dashboardStyles.settingIcon}
        />
        <View style={dashboardStyles.settingTextContainer}>
          <Text style={[
            dashboardStyles.settingTitle,
            destructive && { color: colors.error }
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={dashboardStyles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightContent && (
        <View style={dashboardStyles.settingItemRight}>
          {rightContent}
        </View>
      )}
      {onPress && !rightContent && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={dashboardStyles.screenContainer}>
      {/* Header */}
      <View style={dashboardStyles.settingsHeader}>
        <TouchableOpacity onPress={handleBack} style={dashboardStyles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={dashboardStyles.headerTitle}>Account Settings</Text>
        <View style={dashboardStyles.headerButton} />
      </View>

      <ScrollView style={dashboardStyles.settingsContent}>
        {/* Account Section */}
        <View style={dashboardStyles.settingsSection}>
          <Text style={dashboardStyles.sectionTitle}>Account</Text>
          {renderSettingItem(
            'person-outline',
            'Edit Profile',
            'Change your profile information',
            () => router.push('/edit-profile')
          )}
          {renderSettingItem(
            'lock-closed-outline',
            'Privacy',
            'Manage your privacy settings',
            () => Alert.alert('Privacy Settings', 'Privacy settings coming soon!')
          )}
          {renderSettingItem(
            'key-outline',
            'Change Password',
            'Update your account password',
            () => Alert.alert('Change Password', 'Password change functionality coming soon!')
          )}
        </View>

        {/* Notifications Section */}
        <View style={dashboardStyles.settingsSection}>
          <Text style={dashboardStyles.sectionTitle}>Notifications</Text>
          {renderSettingItem(
            'notifications-outline',
            'Push Notifications',
            'Receive push notifications on your device',
            undefined,
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          )}
          {renderSettingItem(
            'mail-outline',
            'Email Notifications',
            'Receive notifications via email',
            undefined,
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          )}
        </View>

        {/* Privacy Section */}
        <View style={dashboardStyles.settingsSection}>
          <Text style={dashboardStyles.sectionTitle}>Privacy</Text>
          {renderSettingItem(
            'eye-off-outline',
            'Private Profile',
            'Only followers can see your posts',
            undefined,
            <Switch
              value={privateProfile}
              onValueChange={setPrivateProfile}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          )}
          {renderSettingItem(
            'shield-checkmark-outline',
            'Data & Privacy',
            'Manage your data and privacy preferences',
            () => Alert.alert('Data & Privacy', 'Data & privacy settings coming soon!')
          )}
        </View>

        {/* Support Section */}
        <View style={dashboardStyles.settingsSection}>
          <Text style={dashboardStyles.sectionTitle}>Support</Text>
          {renderSettingItem(
            'help-circle-outline',
            'Help Center',
            'Get help and support',
            () => Alert.alert('Help Center', 'Help center coming soon!')
          )}
          {renderSettingItem(
            'chatbubble-outline',
            'Contact Us',
            'Send us your feedback',
            () => Alert.alert('Contact Us', 'Contact functionality coming soon!')
          )}
          {renderSettingItem(
            'information-circle-outline',
            'About',
            'App version and legal information',
            () => Alert.alert('About', 'Version 1.0.0\n\nTerms of Service\nPrivacy Policy')
          )}
        </View>

        {/* Account Actions */}
        <View style={[dashboardStyles.settingsSection, { marginBottom: spacing.xxxxl }]}>
          <Text style={dashboardStyles.sectionTitle}>Account Actions</Text>
          {renderSettingItem(
            'log-out-outline',
            'Sign Out',
            'Sign out of your account',
            handleSignOut,
            undefined,
            true
          )}
          {renderSettingItem(
            'trash-outline',
            'Delete Account',
            'Permanently delete your account',
            handleDeleteAccount,
            undefined,
            true
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}; 