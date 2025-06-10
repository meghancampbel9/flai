import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { landingStyles } from '../styles';
import { Button } from '@/components';

const { width, height } = Dimensions.get('window');

export const LandingScreen: React.FC = () => {
  const { session, loading, onboardingCompleted } = useAuth();
  
  console.log('🏠 LandingPage render - session:', session?.user?.id, 'loading:', loading);
  
  const player = useVideoPlayer(require('../../../../assets/flai-landing.mov'), (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Add error handling for video player and ensure continuous looping
  useEffect(() => {
    if (player) {
      console.log('🎬 Video player initialized');
      const keepPlaying = () => {
        if (player.status === 'idle' || player.status === 'error') {
          player.play();
        }
      };
      const interval = setInterval(keepPlaying, 5000);
      return () => clearInterval(interval);
    }
  }, [player]);

  useEffect(() => {
    if (!loading && session && !onboardingCompleted) {
      console.log('🏠 LandingPage - Authenticated user needs to complete onboarding, redirecting to welcome');
      router.replace('/auth/welcome');
    }
  }, [session, loading, onboardingCompleted]);

  const handleGetStarted = () => {
    console.log('🏠 LandingPage - Get Started clicked');
    router.push('/auth/phone');
  };

  // Show loading while checking auth state
  if (loading) {
    console.log('🏠 LandingPage showing loading');
    return (
      <SafeAreaView style={landingStyles.container}>
        <View style={landingStyles.loadingContainer}>
          <Text style={landingStyles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If authenticated and onboarding completed, show "Go to App"
  if (session && onboardingCompleted) {
    console.log('🏠 LandingPage - Authenticated user with completed onboarding, showing go to app option');
    return (
      <SafeAreaView style={landingStyles.container}>
        <View style={landingStyles.content}>
          <View style={landingStyles.header}>
            <Text style={landingStyles.brandName}>FLAI</Text>
          </View>
          <View style={landingStyles.heroContainer}>
            <Text style={landingStyles.brandName}>Welcome back!</Text>
            <Button
              title="Go to App"
              onPress={() => {
                console.log('🏠 LandingPage - Go to App clicked');
                router.push('/dashboard');
              }}
              size="large"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  console.log('🏠 LandingPage showing normal landing page');

  return (
    <SafeAreaView style={landingStyles.container}>
      <View style={landingStyles.content}>
        {/* Header */}
        <View style={landingStyles.header}>
          <Text style={landingStyles.brandName}>FLAI</Text>
        </View>

        {/* Video */}
        <View style={landingStyles.heroContainer}>
          <View style={landingStyles.videoContainer}>
            <VideoView 
              style={landingStyles.heroVideo} 
              player={player}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              showsTimecodes={false}
              requiresLinearPlayback={true}
              contentFit="cover"
              pointerEvents="none"
            />
          </View>
        </View>

        {/* Bottom Section */}
        <View style={landingStyles.bottomSection}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            size="large"
          />
          <Text style={[landingStyles.termsText, { transform: [{ translateY: 25 }] }]}>
            By creating an account, you agree to our{' '}
            <Text style={landingStyles.linkText}>Terms of Service</Text> and{' '}
            <Text style={landingStyles.linkText}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}; 