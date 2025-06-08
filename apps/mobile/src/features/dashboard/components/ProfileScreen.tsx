import React from 'react';
import { View, Text, Pressable, Alert, PressableStateCallbackType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { componentStyles, colors, typography, spacing } from '@/styles';
import { dashboardStyles } from '../styles';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();

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

  return (
    <SafeAreaView style={dashboardStyles.screenContainer}>
      <View style={dashboardStyles.contentContainer}>
        <Text style={dashboardStyles.sectionTitle}>Profile</Text>
        
        {user && (
          <View style={dashboardStyles.card}>
            <Text style={typography.caption}>Phone:</Text>
            <Text style={dashboardStyles.cardContent}>{user.phone || 'Not available'}</Text>
            
            <Text style={[typography.caption, { marginTop: spacing.md }]}>User ID:</Text>
            <Text style={dashboardStyles.cardContent}>{user.id}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }: PressableStateCallbackType) => [
            dashboardStyles.dangerButton,
            pressed && dashboardStyles.dangerButtonPressed,
          ]}
          onPress={handleSignOut}
        >
          <Text style={dashboardStyles.dangerButtonText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

 