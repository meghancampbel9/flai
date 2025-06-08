import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  PressableStateCallbackType,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { phoneAuth } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';

export default function VerifyScreen() {
  const { phone, devMode } = useLocalSearchParams<{ phone: string; devMode?: string }>();
  const { setDevModeAuth } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const hiddenInputRef = useRef<TextInput>(null);

  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newCode.every(digit => digit !== '') && !isLoading) {
      handleVerify(newCode.join(''));
    }
  };

  const handleHiddenInputChange = (value: string) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Handle both manual typing and auto-fill
    if (numericValue.length <= 6) {
      const digits = numericValue.split('');
      // Pad with empty strings to maintain 6 positions
      while (digits.length < 6) {
        digits.push('');
      }
      setCode(digits);
      
      // Auto-verify when all 6 digits are entered
      if (numericValue.length === 6 && !isLoading) {
        handleVerify(numericValue);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode: string) => {
    if (!phone) {
      Alert.alert('Error', 'Phone number not found. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    
    try {
      // TEMPORARY: Handle development mode bypass
      if (devMode === 'true' && verificationCode === '123456') {
        console.log('🚀 DEVELOPMENT MODE: Bypassing OTP verification');
        // Create a mock session for development
        setDevModeAuth();
        router.push('/auth/welcome');
        return;
      }

      console.log('🔍 Verifying OTP:', { phone, code: verificationCode });
      const { data, error } = await phoneAuth.verifyOTP(phone, verificationCode);
      
      console.log('📱 Verify Response:', { data, error });
      
      if (error) {
        console.error('❌ Verify Error:', error);
        Alert.alert('Invalid Code', error.message || 'Please check your verification code and try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      if (data?.session) {
        console.log('✅ Authentication successful!');
        // Successfully authenticated, navigate to welcome screen
        router.push('/auth/welcome');
      } else {
        console.warn('⚠️ No session returned');
        Alert.alert('Verification Failed', 'Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('💥 Verify Catch Error:', error);
      Alert.alert('Error', 'Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!phone) {
      Alert.alert('Error', 'Phone number not found.');
      return;
    }

    try {
      const { error } = await phoneAuth.sendOTP(phone);
      
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Enter verification code</Text>
        
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {phone}
        </Text>

        {/* Hidden input for auto-fill */}
        <TextInput
          ref={hiddenInputRef}
          style={styles.hiddenInput}
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
        <View style={styles.otpContainer}>
          {code.map((digit, index) => (
            <Pressable
              key={index}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                isLoading && styles.otpInputDisabled
              ]}
              onPress={() => hiddenInputRef.current?.focus()}
            >
              <Text style={styles.otpText}>{digit}</Text>
            </Pressable>
          ))}
        </View>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive a code? </Text>
          <Pressable onPress={handleResendCode}>
            <Text style={styles.resendLink}>Resend</Text>
          </Pressable>
        </View>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Verifying...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '400',
    color: '#000',
    marginBottom: 16,
    lineHeight: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    lineHeight: 24,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  otpInputFilled: {
    borderColor: '#000',
    backgroundColor: '#ffffff',
  },
  otpInputDisabled: {
    opacity: 0.6,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: '#666',
  },
  resendLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  otpText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
}); 