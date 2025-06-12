import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components';
import { componentStyles, colors } from '@/styles';
import { authStyles } from '../styles';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const WelcomeScreen: React.FC = () => {
  const { devMode } = useLocalSearchParams<{ devMode?: string }>();
  const { session, loading } = useAuth();

  useEffect(() => {
    // Only redirect if we're sure there's no session (after loading completes)
    if (!loading && !session) {
      console.log('🚫 Welcome screen - No session found, redirecting to landing');
      router.replace('/');
    }
  }, [session, loading]);

  const handleContinue = () => {
    console.log('🧭 Navigating to username screen');
    router.push({
      pathname: '/auth/username',
      params: devMode ? { devMode } : {}
    });
  };

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <SafeAreaView style={componentStyles.container}>
        <View style={componentStyles.centeredContainer}>
          <Text style={authStyles.welcomeTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't render if no session after loading
  if (!session) {
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