import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ProductDetailScreen } from '@/features/product/components/ProductDetailScreen';
import { colors } from '@/styles';

export default function ProductDetailPageRoute() {
  const { id } = useLocalSearchParams();

  if (!id || typeof id !== 'string') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid Product ID</Text>
      </View>
    );
  }

  return <ProductDetailScreen id={id} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
  }
}); 