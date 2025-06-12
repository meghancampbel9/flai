import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductGrid } from '@/features/product/components/ProductGrid';
import { Product } from '@/types/product';
import { colors, typography, spacing } from '@/styles';
import { dashboardStyles } from '../styles';
import { API_URL } from '@/config/api';

export const HomeScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/products?limit=1000`);
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }
        const data: Product[] = await response.json();
        setAllProducts(data);
        setFilteredProducts(data);
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred');
        Alert.alert('Error', 'Could not load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(allProducts);
    } else {
      const filtered = allProducts.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, allProducts]);

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
            products={filteredProducts}
            type="recommended"
            onProductPress={handleProductPress}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

