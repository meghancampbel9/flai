import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components';
import { componentStyles, colors } from '@/styles';
import { authStyles } from '../styles';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { userService } from '../services/userService';

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

export const WelcomeScreen: React.FC = () => {
  const { devMode } = useLocalSearchParams<{ devMode?: string }>();
  const { session, loading, setDevModeAuth, markOnboardingCompleted } = useAuth();
  const [checkingDevUser, setCheckingDevUser] = useState(false);

  useEffect(() => {
    const setupDevMode = async () => {
      // If in dev mode and no session, set up mock auth
      if (devMode === 'true' && !session && !loading && !checkingDevUser) {
        console.log('🔧 Dev mode: Setting up mock authentication');
        setCheckingDevUser(true);
        await setDevModeAuth();
        
        // Check if dev user profile already exists with completed onboarding
        try {
          console.log('🔍 Checking if dev user profile exists...');
          const profile = await userService.getUserProfile();
          
          if (profile && profile.onboarding_completed) {
            console.log('✅ Dev user profile exists with completed onboarding, skipping to dashboard');
            markOnboardingCompleted();
            router.replace('/dashboard');
            return;
          } else if (profile) {
            console.log('📋 Dev user profile exists but onboarding not completed');
          }
        } catch (error: any) {
          if (error.message === 'PROFILE_NOT_FOUND') {
            console.log('📝 Dev user profile not found, continuing with onboarding');
          } else {
            console.log('⚠️ Error checking dev user profile:', error.message);
          }
        }
        setCheckingDevUser(false);
        return;
      }
      
      // Only redirect if we're sure there's no session (after loading completes) and not in dev mode
      if (!loading && !session && devMode !== 'true') {
        console.log('🚫 Welcome screen - No session found, redirecting to landing');
        router.replace('/');
      }
    };
    
    setupDevMode();
  }, [session, loading, devMode, setDevModeAuth, checkingDevUser, markOnboardingCompleted]);

  const handleContinue = () => {
    console.log('🧭 Navigating to username screen');
    router.push({
      pathname: '/auth/username',
      params: devMode ? { devMode } : {}
    });
  };

  // Show loading state while auth is being checked or dev user is being verified
  if (loading || checkingDevUser) {
    return (
      <SafeAreaView style={componentStyles.container}>
        <View style={componentStyles.centeredContainer}>
          <Text style={authStyles.welcomeTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't render if no session after loading (unless in dev mode, which will set it up)
  if (!session && devMode !== 'true') {
    return null;
  }

  return (
    <SafeAreaView style={componentStyles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={{ flex: 1 }}
      >
        <View style={[componentStyles.content, componentStyles.spaceBetweenContainer]}>
          <View style={componentStyles.centeredContainer}>
            <Text style={authStyles.welcomeTitle}>You're in.</Text>
            <Text style={authStyles.welcomeTitle}>Welcome to FLAI</Text>
          </View>

          <View style={componentStyles.bottomSection}>
            <Button
              title="Continue"
              onPress={handleContinue}
              size="medium"
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}; 