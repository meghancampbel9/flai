import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components';
import { componentStyles, colors, typography, spacing } from '@/styles';
import { COUNTRY_CODES } from '@/constants';
import { authService } from '../services/authService';
import { authStyles } from '../styles';

export const PhoneScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+49');
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleContinue = async () => {
    if (phoneNumber.length < 8) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number.');
      return;
    }

    setIsLoading(true);
    const fullPhoneNumber = countryCode + phoneNumber;

    // TEMPORARY: Skip SMS for testing when Twilio limit is reached
    if (fullPhoneNumber === '+491799004467') {
      console.log('🚀 DEVELOPMENT MODE: Skipping SMS verification');
      Alert.alert(
        'Development Mode', 
        'SMS limit reached. Skipping to verification with test code "123456"',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push({
                pathname: '/auth/verify',
                params: { phone: fullPhoneNumber, devMode: 'true' }
              });
            }
          }
        ]
      );
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 Sending OTP to:', fullPhoneNumber);
      const { data, error } = await authService.sendOTP(fullPhoneNumber);
      
      console.log('📱 OTP Response:', { data, error });
      
      if (error) {
        console.error('❌ OTP Error:', error);
        Alert.alert('Error', error.message || 'Failed to send verification code. Please try again.');
        return;
      }

      console.log('✅ OTP sent successfully, navigating to verify screen');
      router.push({
        pathname: '/auth/verify',
        params: { phone: fullPhoneNumber }
      });
    } catch (error) {
      console.error('💥 Catch Error:', error);
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleCountrySelect = (code: string) => {
    setCountryCode(code);
    setShowCountryPicker(false);
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
            <Text style={componentStyles.screenTitle}>What's your{'\n'}phone number?</Text>

            <View style={authStyles.phoneInputContainer}>
              <Pressable 
                style={authStyles.countryCodeButton}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={authStyles.countryCodeText}>{countryCode}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </Pressable>
              
              <TextInput
                style={authStyles.phoneInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="00 0000 0000"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Bottom Section */}
          <View style={[componentStyles.bottomSection, { marginTop: 'auto' }]}>
            <Button
              title={isLoading ? 'Sending...' : 'Continue'}
              onPress={handleContinue}
              disabled={phoneNumber.length < 8 || isLoading}
              loading={isLoading}
              size="large"
            />
          </View>
        </ScrollView>

        {/* Country Picker Dropdown */}
        {showCountryPicker && (
          <>
            <Pressable 
              style={authStyles.countryPickerOverlay}
              onPress={() => setShowCountryPicker(false)} 
            />
            <View style={[
              authStyles.countryPickerDropdown,
              {
                left: spacing.screenHorizontal,
                right: spacing.screenHorizontal,
              },
              componentStyles.cardShadow
            ]}>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {COUNTRY_CODES.map((country) => (
                  <Pressable
                    key={country.code}
                    style={[
                      authStyles.countryPickerItem,
                      countryCode === country.code && authStyles.countryPickerItemSelected,
                    ]}
                    onPress={() => handleCountrySelect(country.code)}
                  >
                    <Text style={authStyles.countryPickerFlag}>{country.flag}</Text>
                    <Text style={authStyles.countryPickerName}>{country.country}</Text>
                    <Text style={authStyles.countryPickerCode}>{country.code}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}; 