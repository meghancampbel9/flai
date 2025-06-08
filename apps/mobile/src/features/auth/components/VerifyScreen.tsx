import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components';
import { componentStyles, colors, typography, spacing } from '@/styles';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { authStyles } from '../styles';

export const VerifyScreen: React.FC = () => {
  const { phone, devMode } = useLocalSearchParams<{ phone: string; devMode?: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const hiddenInputRef = useRef<TextInput>(null);
  const { setDevModeAuth } = useAuth();

  const handleVerify = async (verificationCode: string) => {
    console.log('🔍 handleVerify called with code:', verificationCode);
    console.log('📱 Phone:', phone, 'DevMode:', devMode);
    
    if (!phone) {
      console.log('❌ No phone number found');
      Alert.alert('Error', 'Phone number not found.');
      return;
    }

    console.log('⏳ Setting loading to true');
    setIsLoading(true);

    // Development mode bypass
    if (devMode === 'true' && verificationCode === '123456') {
      console.log('🔧 Development mode: Using mock verification');
      console.log('🧭 Navigating to welcome screen first, then setting auth');
      
      // Navigate first, then set auth on the welcome screen
      try {
        console.log('🔄 Navigating to welcome with devMode flag');
        router.push('/auth/welcome?devMode=true');
        console.log('✅ Navigation call completed');
      } catch (error) {
        console.log('❌ Navigation error:', error);
      }
      setIsLoading(false);
      return;
    }

    try {
      console.log('🚀 Calling authService.verifyOTP...');
      const { data, error } = await authService.verifyOTP(phone, verificationCode);
      
      console.log('📱 VerifyOTP response:', { data: !!data, error: error?.message });
      
      if (error) {
        console.log('❌ Verification error:', error.message);
        Alert.alert('Verification Failed', error.message || 'Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else if (data?.session) {
        console.log('✅ Verification successful, navigating to welcome');
        router.replace('/auth/welcome');
      } else {
        console.log('⚠️ No session in response');
        Alert.alert('Verification Failed', 'Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.log('💥 Verification catch error:', error);
      Alert.alert('Error', 'Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      console.log('✅ Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleHiddenInputChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6).split('');
    const newCode = [...digits, ...Array(6 - digits.length).fill('')];
    setCode(newCode);

    // Auto-verify when all 6 digits are entered (but also allow manual verification)
    if (digits.length === 6) {
      handleVerify(digits.join(''));
    }
  };

  const handleManualContinue = () => {
    console.log('🔘 Manual continue pressed');
    const fullCode = code.join('');
    console.log('📱 Current code:', fullCode, 'length:', fullCode.length);
    
    if (fullCode.length === 6) {
      console.log('✅ Code complete, calling handleVerify');
      handleVerify(fullCode);
    } else {
      console.log('❌ Code incomplete');
      Alert.alert('Incomplete Code', 'Please enter all 6 digits.');
    }
  };

  const handleResendCode = async () => {
    if (!phone) {
      Alert.alert('Error', 'Phone number not found.');
      return;
    }

    try {
      const { error } = await authService.sendOTP(phone);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to resend code. Please try again.');
      } else {
        Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    }
  };

  const handleBack = () => {
    router.back();
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
            <Text style={componentStyles.screenTitle}>Enter verification code</Text>
            
            <Text style={componentStyles.screenSubtitle}>
              We sent a 6-digit code to {phone}
            </Text>

            {/* Hidden input for auto-fill */}
            <TextInput
              ref={hiddenInputRef}
              style={authStyles.hiddenInput}
              value={code.join('')}
              onChangeText={handleHiddenInputChange}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              editable={!isLoading}
              autoFocus={true}
            />

            {/* OTP Input */}
            <View style={authStyles.otpContainer}>
              {code.map((digit, index) => (
                <Pressable
                  key={index}
                  style={[
                    authStyles.otpInput,
                    digit ? authStyles.otpInputFilled : authStyles.otpInputEmpty,
                    isLoading && authStyles.otpInputDisabled,
                  ]}
                  onPress={() => hiddenInputRef.current?.focus()}
                >
                  <Text style={typography.otp}>{digit}</Text>
                </Pressable>
              ))}
            </View>

            {/* Resend Code */}
            <View style={authStyles.resendContainer}>
              <Text style={authStyles.resendText}>Didn't receive a code? </Text>
              <Pressable onPress={handleResendCode}>
                <Text style={authStyles.resendButton}>Resend</Text>
              </Pressable>
            </View>
          </View>

          {/* Bottom Section with Continue Button */}
          <View style={[componentStyles.bottomSection, { marginTop: 'auto' }]}>
            <Button
              title={isLoading ? 'Verifying...' : 'Continue'}
              onPress={handleManualContinue}
              disabled={code.join('').length < 6 || isLoading}
              loading={isLoading}
              size="large"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}; 