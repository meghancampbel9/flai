import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dashboardStyles } from '../styles';
import { typography, spacing } from '@/styles';

export const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={dashboardStyles.screenContainer}>
      <View style={[dashboardStyles.contentContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.h1, { textAlign: 'center', marginBottom: spacing.lg }]}>Welcome to FLAI</Text>
        <Text style={[typography.body, { textAlign: 'center' }]}>Your AI-powered shopping experience</Text>
      </View>
    </SafeAreaView>
  );
}; 