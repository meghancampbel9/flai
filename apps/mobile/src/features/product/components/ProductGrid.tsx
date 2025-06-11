import React from 'react';
import { View, FlatList, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductCard } from './ProductCard';
import { Product, ProductGridType } from '../../../types/product';
import { colors } from '../../../styles';
import { productStyles } from '../styles';

interface ProductGridProps {
  products: Product[];
  type: ProductGridType;
  onProductPress?: (product: Product) => void;
  loading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  type, 
  onProductPress,
  loading = false 
}) => {
  const getEmptyStateConfig = () => {
    switch (type) {
      case 'closet':
        return {
          icon: 'shirt-outline' as const,
          title: 'No items in your closet',
          message: 'Items you purchase will appear here'
        };
      case 'wishlist':
        return {
          icon: 'heart-outline' as const,
          title: 'No items in your wishlist',
          message: 'Items you favorite will appear here'
        };
      case 'recommended':
        return {
          icon: 'sparkles-outline' as const,
          title: 'No recommendations yet',
          message: 'Complete your Pinterest board analysis to get personalized recommendations'
        };
      default:
        return {
          icon: 'grid-outline' as const,
          title: 'No items found',
          message: 'Check back later for new items'
        };
    }
  };

  const renderEmptyState = () => {
    const config = getEmptyStateConfig();
    
    return (
      <View style={productStyles.productGridEmptyState}>
        <Ionicons 
          name={config.icon} 
          size={60} 
          color={colors.textSecondary} 
        />
        <Text style={productStyles.productGridEmptyTitle}>
          {config.title}
        </Text>
        <Text style={productStyles.productGridEmptyMessage}>
          {config.message}
        </Text>
      </View>
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard 
      product={item} 
      onPress={onProductPress}
    />
  );

  if (loading) {
    return (
      <View style={productStyles.productGridLoadingContainer}>
        <Text style={productStyles.productGridLoadingText}>Loading products...</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={productStyles.productGridContainer}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={productStyles.productGridRow}
        contentContainerStyle={productStyles.productGridContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Disable scroll since it's inside a ScrollView
      />
    </View>
  );
}; 