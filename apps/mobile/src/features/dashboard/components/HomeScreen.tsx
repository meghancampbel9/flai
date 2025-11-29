import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductGrid } from '@/features/product/components/ProductGrid';
import { Product } from '@/types/product';
import { colors, typography, spacing } from '@/styles';
import { dashboardStyles } from '../styles';
import { API_URL } from '@/config/api';
import { getStyleRecommendations } from '@/services/recommendationService';

export const HomeScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch recommendations and all products in parallel
        const [recommendations, all] = await Promise.all([
          getStyleRecommendations(),
          fetch(`${API_URL}/products?limit=500`).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
            return res.json();
          })
        ]);

        setRecommendedProducts(recommendations);
        setAllProducts(all);
        setFilteredProducts(all);

      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred');
        Alert.alert('Error', 'Could not load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
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

  const handleUserSearchPress = () => {
    router.push('/user-search');
  };

  return (
    <SafeAreaView style={dashboardStyles.screenContainer} edges={['top']}>
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
              placeholder="Type what you're looking for..."
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
          <TouchableOpacity
            style={dashboardStyles.userSearchButton}
            onPress={handleUserSearchPress}
          >
            <Ionicons name="people" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Product Grid */}
        <ScrollView 
          style={dashboardStyles.scrollContainer} 
          contentContainerStyle={dashboardStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {searchQuery.length === 0 && recommendedProducts.length > 0 && (
            <>
              <ProductGrid
                products={recommendedProducts}
                type="recommended"
                onProductPress={handleProductPress}
                loading={loading}
              />
            </>
          )}
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

