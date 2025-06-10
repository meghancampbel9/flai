import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { landingStyles } from '../styles';
import { Button } from '@/components';

const { width, height } = Dimensions.get('window');

export const LandingScreen: React.FC = () => {
  const { session, loading, onboardingCompleted } = useAuth();
  const pathname = usePathname();
  
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
    if (loading) return;
    if (pathname.startsWith('/auth/')) return; 
    if (session && onboardingCompleted) {
      console.log('🏠 LandingPage - Authenticated user with completed onboarding, redirecting to dashboard');
      router.replace('/dashboard');
    } else if (session && onboardingCompleted === false) {
      console.log('🏠 LandingPage - Authenticated user needs to complete onboarding, redirecting to welcome');
      router.replace('/auth/welcome');
    }
  }, [session, loading, onboardingCompleted, pathname]);

  const handleGetStarted = () => {
    console.log('🏠 LandingPage - Get Started clicked');
    router.push('/auth/phone');
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <SafeAreaView style={landingStyles.container}>
        <View style={landingStyles.loadingContainer}>
          <Text style={landingStyles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }



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
        </View>
        <Text style={landingStyles.termsText}>
          By creating an account, you agree to our{' '}
          <Text style={landingStyles.linkText}>Terms of Service</Text> and{' '}
          <Text style={landingStyles.linkText}>Privacy Policy</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
};