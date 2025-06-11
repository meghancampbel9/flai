import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components';
import { componentStyles, colors, typography, spacing } from '@/styles';
import { authStyles } from '../styles';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';

export const UsernameScreen: React.FC = () => {
  const { devMode } = useLocalSearchParams<{ devMode?: string }>();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const { setDevModeAuth, session } = useAuth();

  const validateUsername = (value: string) => {
    setError('');
    setIsAvailable(null);
    
    if (!value) return;
    if (value.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (value.length > 30) {
      setError('Username must be less than 30 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    // Reserved usernames
    const reserved = ['admin', 'api', 'www', 'app', 'support', 'help', 'about'];
    if (reserved.includes(value.toLowerCase())) {
      setError('This username is not available');
      return;
    }
    
    // Check availability
    checkAvailability(value);
  };
  
  const checkAvailability = async (value: string) => {
    setIsChecking(true);
    try {
      const result = await userService.checkUsernameAvailability(value);
      setIsAvailable(result.available);
      if (!result.available) {
        setError('This username is already taken');
      }
    } catch (error) {
      console.error('Failed to check username availability:', error);
      setError('Unable to check username availability. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleContinue = async () => {
    if (!username || error || !isAvailable) {
      Alert.alert('Invalid Username', 'Please enter a valid and available username.');
      return;
    }
    setIsLoading(true);
    
    try {
      // Get user ID - either from session or dev mode
      let userId: string;
      if (devMode === 'true') {
        console.log('🔧 Using dev mode authentication');
        setDevModeAuth();
        userId = 'dev-user-id';
      } else if (session?.user?.id) {
        userId = session.user.id;
      } else {
        Alert.alert('Error', 'User session not found. Please try logging in again.');
        return;
      }

      // Create user profile in database
      console.log('💾 Creating user profile for:', username);
      await userService.createUserProfile({
        user_id: userId,
        username: username,
        display_name: username, // Default display name to username
        phone_number: session?.user?.phone || undefined, // Include phone number from session
      });
      
      console.log('✅ User profile created successfully');
      
      // Navigate to Shopping Preference screen
      console.log('🧭 Navigating to Shopping Preference screen');
      router.push({
        pathname: '/auth/shopping-preference',
        params: devMode ? { devMode } : {}
      });
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      Alert.alert('Error', 'Failed to save username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    if (username) {
      const timeoutId = setTimeout(() => {
        validateUsername(username);
      }, 100); // Debounce validation
      
      return () => clearTimeout(timeoutId);
    }
  }, [username]);

  const getInputBorderColor = () => {
    if (error) return colors.error;
    if (isAvailable === true) return colors.success;
    if (isChecking) return colors.info;
    return colors.border;
  };

  const getStatusIcon = () => {
    if (isChecking) return <Ionicons name="time-outline" size={20} color={colors.info} />;
    if (isAvailable === true) return <Ionicons name="checkmark-circle" size={20} color={colors.success} />;
    if (error) return <Ionicons name="close-circle" size={20} color={colors.error} />;
    return null;
  };

  return (
    <SafeAreaView style={componentStyles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={componentStyles.header}>
            <Pressable onPress={handleBack} style={componentStyles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Content */}
          <View style={[componentStyles.content, { paddingTop: spacing.xxxxl }]}>
            <Text style={componentStyles.screenTitle}>Choose your username</Text>
            {/* Username Input */}
            <View style={authStyles.usernameInputContainer}>
              <Text style={authStyles.usernamePrefix}>@</Text>
              <TextInput
                style={[
                  authStyles.usernameInput,
                  { borderColor: getInputBorderColor() }
                ]}
                value={username}
                onChangeText={setUsername}
                placeholder="your_username"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
                editable={!isLoading}
                autoFocus={true}
              />
              <View style={authStyles.usernameStatusIcon}>
                {getStatusIcon()}
              </View>
            </View>

            {/* Error/Success Message */}
            {error && (
              <Text style={authStyles.usernameError}>{error}</Text>
            )}
            
            {isAvailable === true && !error && (
              <Text style={authStyles.usernameSuccess}>✓ Username is available!</Text>
            )}
          </View>

          {/* Continue Button */}
          <View style={[componentStyles.bottomSection, { marginTop: 'auto' }]}>
            <Button
              title={isLoading ? 'Setting up...' : 'Continue'}
              onPress={handleContinue}
              disabled={!username || !!error || !isAvailable || isLoading}
              loading={isLoading}
              size="large"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}; 