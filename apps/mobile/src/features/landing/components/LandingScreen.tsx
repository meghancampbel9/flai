import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingScreen } from '@/components/LoadingScreen';
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

  useEffect(() => {
    if (loading) return;
    if (pathname.startsWith('/auth/')) return;
    
    if (session && onboardingCompleted === true) {
      router.replace('/dashboard');
    } else if (session && onboardingCompleted === false) {
      router.replace('/auth/welcome');
    }
  }, [session, loading, onboardingCompleted, pathname]);

  const handleGetStarted = () => {
    router.push('/auth/phone');
  };

  // Show loading screen while checking auth state
  if (loading) {
    return <LoadingScreen message="Setting up your experience..." />;
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