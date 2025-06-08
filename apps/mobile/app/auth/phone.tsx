import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  PressableStateCallbackType,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { phoneAuth } from '../../lib/supabase';

// Common country codes
const COUNTRY_CODES = [
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
];

export default function PhoneScreen() {
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
    if (fullPhoneNumber === '+491799004465') {
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
      const { data, error } = await phoneAuth.sendOTP(fullPhoneNumber);
      
      console.log('📱 OTP Response:', { data, error });
      
      if (error) {
        console.error('❌ OTP Error:', error);
        Alert.alert('Error', error.message || 'Failed to send verification code. Please try again.');
        return;
      }

      console.log('✅ OTP sent successfully, navigating to verify screen');
      // Navigate to verification screen with phone number
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>What's your{'\n'}phone number?</Text>

            <View style={styles.phoneInputContainer}>
              <Pressable 
                style={styles.countryCodeContainer}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </Pressable>
              
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="00 0000 0000"
                placeholderTextColor="#ccc"
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Bottom Section with Continue Button */}
          <View style={styles.bottomSection}>
            <Pressable
              style={({ pressed }: PressableStateCallbackType) => [
                styles.continueButton,
                (phoneNumber.length < 8 || isLoading) && styles.continueButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleContinue}
              disabled={phoneNumber.length < 8 || isLoading}
            >
              <Text style={[
                styles.continueText,
                (phoneNumber.length < 8 || isLoading) && styles.continueTextDisabled
              ]}>
                {isLoading ? 'Sending...' : 'Continue'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Country Picker Dropdown */}
        {showCountryPicker && (
          <>
            <Pressable 
              style={styles.dropdownOverlay} 
              onPress={() => setShowCountryPicker(false)} 
            />
            <View style={styles.dropdown}>
                             <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                 {COUNTRY_CODES.map((country) => (
                   <Pressable
                     key={country.code}
                     style={[
                       styles.dropdownItem,
                       countryCode === country.code && styles.dropdownItemSelected
                     ]}
                     onPress={() => handleCountrySelect(country.code)}
                   >
                     <Text style={styles.dropdownFlag}>{country.flag}</Text>
                     <Text style={styles.dropdownCountry}>{country.country}</Text>
                     <Text style={styles.dropdownCode}>{country.code}</Text>
                   </Pressable>
                 ))}
              </ScrollView>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '400',
    color: '#000',
    marginBottom: 60,
    lineHeight: 40,
    textAlign: 'center',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
    marginBottom: 20,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  countryCode: {
    fontSize: 18,
    color: '#000',
    marginRight: 4,
    fontWeight: '400',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    padding: 0,
    marginLeft: 8,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    marginTop: 'auto',
  },
  continueButton: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueTextDisabled: {
    color: '#999',
  },

  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    top: 140,
    left: 24,
    right: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownScroll: {
    flex: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#f8f9fa',
  },
  dropdownFlag: {
    fontSize: 18,
    marginRight: 12,
  },
  dropdownCountry: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  dropdownCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
}); 