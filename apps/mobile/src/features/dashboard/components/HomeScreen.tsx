import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductGrid } from '@/features/product/components/ProductGrid';
import { Product } from '@/types/product';
import { mockRecommendedItems } from '@/data/mockProducts';
import { colors, typography, spacing } from '@/styles';
import { dashboardStyles } from '../styles';

export const HomeScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(mockRecommendedItems);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Filter products based on search query
    // TODO semantic search based on vector embeddings
    if (searchQuery.trim() === '') {
      setProducts(mockRecommendedItems);
    } else {
      const filteredProducts = mockRecommendedItems.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setProducts(filteredProducts);
    }
  }, [searchQuery]);

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  return (
    <SafeAreaView style={dashboardStyles.screenContainer}>
      <KeyboardAvoidingView 
        style={dashboardStyles.homeContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Search Bar */}
        <View style={dashboardStyles.searchContainer}>
          <View style={dashboardStyles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={dashboardStyles.searchIcon} />
            <TextInput
              style={dashboardStyles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Ionicons 
                name="close" 
                size={20} 
                color={colors.textSecondary} 
                style={dashboardStyles.clearIcon}
                onPress={() => setSearchQuery('')}
              />
            )}
          </View>
        </View>

        {/* Product Grid */}
        <ScrollView 
          style={dashboardStyles.scrollContainer} 
          contentContainerStyle={dashboardStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <ProductGrid
            products={products}
            type="recommended"
            onProductPress={handleProductPress}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

