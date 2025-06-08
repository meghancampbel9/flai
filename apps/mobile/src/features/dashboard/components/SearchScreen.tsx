import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dashboardStyles } from '../styles';

export const SearchScreen: React.FC = () => {
  return (
    <SafeAreaView style={dashboardStyles.screenContainer}>
      <View style={dashboardStyles.emptyState}>
        <Text style={dashboardStyles.emptyStateTitle}>Search</Text>
        <Text style={dashboardStyles.emptyStateMessage}>AI-powered visual search coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}; 