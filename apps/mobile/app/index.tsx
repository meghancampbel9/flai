import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  PressableStateCallbackType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAuth } from '../lib/auth-context';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const { session, loading } = useAuth();
  
  console.log('🏠 LandingPage render - session:', session?.user?.id, 'loading:', loading);
  
  const player = useVideoPlayer(require('../assets/flai-landing.mov'), (player) => {
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

  const handleGetStarted = () => {
    console.log('🏠 LandingPage - Get Started clicked');
    router.push('/auth/phone');
  };

  // Show loading while checking auth state
  if (loading) {
    console.log('🏠 LandingPage showing loading');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If authenticated, show a "Go to App" button instead of auto-redirecting
  if (session) {
    console.log('🏠 LandingPage - Authenticated user, showing go to app option');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.brandName}>FLAI</Text>
          </View>
          <View style={styles.heroSection}>
            <Text style={styles.brandName}>Welcome back!</Text>
            <Pressable
              style={({ pressed }: PressableStateCallbackType) => [
                styles.getStartedButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                console.log('🏠 LandingPage - Go to App clicked');
                router.push('/(tabs)');
              }}
            >
              <Text style={styles.getStartedText}>Go to App</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  console.log('🏠 LandingPage showing normal landing page');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>FLAI</Text>
        </View>

        {/* Hero Section with Video */}
        <View style={styles.heroSection}>
          <View style={styles.videoContainer}>
            <VideoView 
              style={styles.heroVideo} 
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
        <View style={styles.bottomSection}>
          <Pressable
            style={({ pressed }: PressableStateCallbackType) => [
              styles.getStartedButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleGetStarted}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </Pressable>

          <Text style={styles.termsText}>
            By creating an account, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 1,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: width * 0.8,
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroVideo: {
    width: 300,
    height: 510,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 25,
    marginBottom: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#666666',
  },
}); 