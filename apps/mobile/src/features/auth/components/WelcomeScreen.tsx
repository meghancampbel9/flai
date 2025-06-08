import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components';
import { componentStyles, colors, typography, spacing } from '@/styles';
import { useAuth } from '../hooks/useAuth';
import { authStyles } from '../styles';

export const WelcomeScreen: React.FC = () => {
  const { devMode } = useLocalSearchParams<{ devMode?: string }>();
  const { setDevModeAuth } = useAuth();

  useEffect(() => {
    // Welcome screen no longer sets auth automatically
    // Auth will be set when user clicks Continue
    console.log('🔧 Welcome screen loaded, devMode:', devMode);
  }, [devMode]);

  const handleContinue = () => {
    // Set up authentication (real or mock) when user completes onboarding
    if (devMode === 'true') {
      console.log('🔧 Welcome screen: Setting up development mode authentication on continue');
      setDevModeAuth();
    }
    
    // Navigate to main app dashboard
    router.replace('/dashboard');
  };

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