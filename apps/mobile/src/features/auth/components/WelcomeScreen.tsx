import React from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components';
import { componentStyles, colors } from '@/styles';
import { authStyles } from '../styles';

export const WelcomeScreen: React.FC = () => {
  const { devMode } = useLocalSearchParams<{ devMode?: string }>();

  const handleContinue = () => {
    console.log('🧭 Navigating to username screen');
    router.push({
      pathname: '/auth/username',
      params: devMode ? { devMode } : {}
    });
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