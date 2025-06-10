import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components';
import { componentStyles, colors, typography, spacing } from '@/styles';
import { authStyles } from '../styles';
import { useAuth } from '../hooks/useAuth';
import { pinterestService, StyleAnalysis } from '../services/pinterestService';
import { userService } from '../services/userService';

export const PinterestScreen: React.FC = () => {
  const { devMode } = useLocalSearchParams<{ devMode?: string }>();
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const { setDevModeAuth, user, markOnboardingCompleted } = useAuth();

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Construct full Pinterest URL from user input
  const constructPinterestUrl = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    // If user enters full URL, use as-is
    if (trimmed.startsWith('http')) {
      return trimmed;
    }
    // Otherwise, prepend pinterest.com/
    return `https://pinterest.com/${trimmed}`;
  };

  const validateUserInput = async (input: string) => {
    if (!input.trim()) {
      setError('');
      return true;
    }

    const trimmed = input.trim();
    
    // Validate format: username/boardname or full URL
    const userBoardRegex = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?$/;
    const fullUrlRegex = /^https?:\/\/(www\.)?(pinterest\.(com|ca|co\.uk|fr|de|es|it|jp|au)|pin\.it)\/[a-zA-Z0-9_\/-]+$/;
    
    if (!userBoardRegex.test(trimmed) && !fullUrlRegex.test(trimmed)) {
      if (trimmed.includes('/')) {
        setError('Format should be: username/boardname');
      } else {
        setError('Please include both username and board name: username/boardname');
      }
      return false;
    }
    
    // Additional validation for username/board format
    if (userBoardRegex.test(trimmed)) {
      const parts = trimmed.split('/');
      if (parts[0].length < 3) {
        setError('Username must be at least 3 characters');
        return false;
      }
      if (parts[1].length < 2) {
        setError('Board name must be at least 2 characters');
        return false;
      }
    }
    
    setError('');
    return true;
  };

  const analyzePinterestBoard = async (): Promise<{ success: boolean; hasValidationError: boolean }> => {
    console.log('🎯 analyzePinterestBoard started', { userInput: userInput.trim() });
    
    if (!userInput.trim()) {
      console.log('❌ No user input provided');
      return { success: false, hasValidationError: false };
    }

    const isValid = await validateUserInput(userInput);
    if (!isValid) {
      console.log('❌ Input validation failed');
      return { success: false, hasValidationError: true };
    }

    // API call that handles validation + analysis
    setIsAnalyzing(true);
    setError('');
    try {
      const userId = user?.id || 'dev-user-id';
      const fullUrl = constructPinterestUrl(userInput);
      console.log('📡 Starting Pinterest board analysis:', fullUrl);
      const result = await pinterestService.analyzeBoard(fullUrl, userId);
      console.log('📨 Analysis result type:', result.success ? 'SUCCESS' : result.validation_error ? 'VALIDATION_ERROR' : 'ANALYSIS_ERROR');
      
      if (result.validation_error) {
        console.log('⚠️ Validation failed:', result.message);
        setError(result.message);
        return { success: false, hasValidationError: true };
      }
      
      if (result.success && result.style_analysis) {
        console.log('✅ Style analysis completed successfully');
        setStyleAnalysis(result.style_analysis);
        setError('');
        return { success: true, hasValidationError: false };
      } else {
        console.log('❌ Analysis failed:', result.message);
        setError(result.message || 'Failed to analyze Pinterest board');
        return { success: false, hasValidationError: false };
      }
    } catch (error) {
      console.error('❌ Error during Pinterest analysis:', error);
      setError('Unable to connect to the server. Please try again.');
      return { success: false, hasValidationError: false };
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      // If there's user input but no analysis yet, analyze first
      if (userInput.trim() && !styleAnalysis && !isAnalyzing) {
        console.log('🔍 Starting Pinterest board analysis...');
        const analysisResult = await analyzePinterestBoard();
        console.log('📊 Analysis result:', analysisResult);
        
        // If analysis failed or has validation errors, don't continue
        if (!analysisResult.success) {
          setIsLoading(false);
          console.log('❌ Analysis failed, staying on Pinterest screen');
          return;
        }
      }
      
      // Step 1: Link Pinterest board if provided
      if (user?.id && userInput.trim()) {
        try {
          const fullUrl = constructPinterestUrl(userInput);
          console.log('📌 Linking Pinterest board to user profile...');
          await userService.updatePinterestBoard(user.id, fullUrl);
          console.log('✅ Pinterest board linked successfully');
        } catch (error) {
          console.error('⚠️ Failed to link Pinterest board:', error);
          setError('Failed to link Pinterest board. Please try again.');
          setIsLoading(false);
          return;
        }
      }
      
      // Step 2: Complete onboarding
      if (user?.id) {
        try {
          console.log('🎓 Completing onboarding...');
          await userService.completeOnboarding(user.id);
          console.log('✅ Onboarding completed in database');
        } catch (error) {
          console.error('⚠️ Failed to complete onboarding in database:', error);
          setError('Failed to complete onboarding. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // For dev mode, set up auth after Pinterest step
      if (devMode === 'true') {
        console.log('🔧 Setting up development mode authentication');
        setDevModeAuth();
      }
      
      markOnboardingCompleted();
      console.log('✅ Onboarding marked as completed in auth context');
      
      // Give auth context time to update before navigation
      setTimeout(() => {
        console.log('🧭 Navigating to dashboard');
        router.replace('/dashboard');
      }, 100);
      
    } catch (error) {
      console.error('❌ Error in Pinterest flow:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('⏭️ Skipping Pinterest integration');
    handleContinue();
  };

  const handleBack = () => {
    router.back();
  };

  const handleInputChange = (text: string) => {
    setUserInput(text);
    setStyleAnalysis(null);
    
    if (text.trim()) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      const newTimer = setTimeout(() => validateUserInput(text), 500);
      setDebounceTimer(newTimer);
    } else {
      setError('');
    }
  };

  return (
    <SafeAreaView style={componentStyles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 100}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.xxxxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={componentStyles.header}>
            <Pressable onPress={handleBack} style={componentStyles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Content */}
          <View style={[componentStyles.content, { paddingTop: spacing.xl, flex: 1 }]}>
            <Text style={componentStyles.screenTitle}>What inspires your style?</Text>
            
            <Text style={componentStyles.screenSubtitle}>
              Share a Pinterest board that captures your aesthetic. We'll use it to curate personalized recommendations just for you.
            </Text>

            {/* Pinterest URL Input */}
            <View style={authStyles.pinterestInputContainer}>
              <Ionicons 
                name="logo-pinterest" 
                size={24} 
                color={colors.error} 
                style={authStyles.pinterestIcon} 
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={[authStyles.urlPrefix, { color: colors.textSecondary }]}>
                  pinterest.com/
                </Text>
                <TextInput
                  style={[
                    authStyles.pinterestInput,
                    { borderColor: error ? colors.error : colors.border, flex: 1, paddingLeft: 0 }
                  ]}
                  value={userInput}
                  onChangeText={handleInputChange}
                  placeholder="username/boardname"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                  editable={!isLoading}
                  autoFocus={true}
                />
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <Text style={authStyles.pinterestError}>{error}</Text>
            )}
          </View>

          {/* Bottom Section with Buttons */}
          <View style={[componentStyles.bottomSection, { marginTop: 'auto', paddingBottom: spacing.lg }]}>
            <Button
              title={
                isAnalyzing ? 'Analyzing your style...' : 
                isLoading ? 'Saving...' : 
                (userInput.trim() && !styleAnalysis) ? 'Analyze & Continue' :
                'Continue'
              }
              onPress={handleContinue}
              disabled={isLoading || isAnalyzing || (!!userInput.trim() && !!error)}
              loading={isLoading || isAnalyzing}
              size="large"
            />
            
            <Pressable 
              onPress={handleSkip} 
              style={authStyles.skipButton}
              disabled={isLoading || isAnalyzing}
            >
              <Text style={authStyles.skipButtonText}>Skip for now</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}; 