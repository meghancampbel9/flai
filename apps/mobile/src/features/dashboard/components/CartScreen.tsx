import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dashboardStyles } from '../styles';

export const CartScreen: React.FC = () => {
  return (
    <SafeAreaView style={dashboardStyles.screenContainer}>
      <View style={dashboardStyles.emptyState}>
        <Text style={dashboardStyles.emptyStateTitle}>Cart</Text>
        <Text style={dashboardStyles.emptyStateMessage}>Your shopping cart is empty</Text>
      </View>
    </SafeAreaView>
  );
}; 