import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components';
import { componentStyles, colors, typography, spacing } from '@/styles';
import { authStyles } from '../styles';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';

type ShoppingPreference = 'womenswear' | 'menswear' | 'everything';

export const ShoppingPreferenceScreen: React.FC = () => {
  const { devMode } = useLocalSearchParams<{ devMode?: string }>();
  const { user } = useAuth();
  const [selectedPreference, setSelectedPreference] = useState<ShoppingPreference | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const options: { value: ShoppingPreference; label: string; icon: string }[] = [
    { value: 'womenswear', label: 'Womenswear', icon: 'woman-outline' },
    { value: 'menswear', label: 'Menswear', icon: 'man-outline' },
    { value: 'everything', label: 'Everything', icon: 'heart-outline' },
  ];

  const handleContinue = async () => {
    if (!selectedPreference) return;
    
    setIsLoading(true);
    try {
      // Update user profile with shopping preference
      await userService.updateUserProfile({
        shopping_preference: selectedPreference
      });
      
      // Navigate to Pinterest screen
      router.push({
        pathname: '/auth/pinterest',
        params: devMode ? { devMode } : {}
      });
    } catch (error) {
      console.error('❌ Error saving shopping preference:', error);
      // Continue anyway - don't block onboarding
      router.push({
        pathname: '/auth/pinterest',
        params: devMode ? { devMode } : {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={componentStyles.container}>
      {/* Header */}
      <View style={componentStyles.header}>
        <Pressable onPress={handleBack} style={componentStyles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={[componentStyles.content, componentStyles.spaceBetweenContainer]}>
        <View>
          <Text style={componentStyles.screenTitle}>
            What are you{'\n'}shopping for?
          </Text>

          {/* Options */}
          <View style={authStyles.preferencesContainer}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  authStyles.preferenceOption,
                  selectedPreference === option.value && authStyles.preferenceOptionSelected
                ]}
                onPress={() => setSelectedPreference(option.value)}
                disabled={isLoading}
              >
                <View style={authStyles.preferenceOptionContent}>
                  <Text style={[
                    authStyles.preferenceOptionText,
                    selectedPreference === option.value && authStyles.preferenceOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </View>
                
                {/* Selection indicator */}
                <View style={[
                  authStyles.preferenceSelectionIndicator,
                  selectedPreference === option.value && authStyles.preferenceSelectionIndicatorSelected
                ]}>
                  {selectedPreference === option.value && (
                    <Ionicons name="checkmark" size={16} color={colors.background} />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bottom Section */}
        <View style={componentStyles.bottomSection}>
          <Button
            title={isLoading ? 'Saving...' : 'Continue'}
            onPress={handleContinue}
            disabled={!selectedPreference || isLoading}
            loading={isLoading}
            size="large"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}; 