import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/styles';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.lg,
        textAlign: 'center',
      }}>
        {message}
      </Text>
    </SafeAreaView>
  );
}; 