import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Product } from '../../../types/product';
import { productStyles } from '../styles';

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const formatPrice = (price: number, currency: string) => {
    return `${currency}${price}`;
  };

  const renderPricing = () => {
    if (product.is_on_sale && product.original_price) {
      // Show current price and crossed out original price
      return (
        <View style={productStyles.productPricingContainer}>
          <Text style={productStyles.productSalePrice}>
            {formatPrice(product.price, product.currency)}
          </Text>
          <Text style={productStyles.productOriginalPrice}>
            {formatPrice(product.original_price, product.currency)}
          </Text>
        </View>
      );
    } else {
      // Show regular price
      return (
        <Text style={productStyles.productPrice}>
          {formatPrice(product.price, product.currency)}
        </Text>
      );
    }
  };

  return (
    <TouchableOpacity 
      style={productStyles.productCard} 
      onPress={() => onPress?.(product)}
      activeOpacity={0.7}
    >
      <View style={productStyles.productImageContainer}>
        <Image 
          source={{ uri: product.image_url }} 
          style={productStyles.productImage}
          resizeMode="cover"
        />
      </View>
      
      <View style={productStyles.productInfo}>
        <Text style={productStyles.productBrandName} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={productStyles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        {renderPricing()}
      </View>
    </TouchableOpacity>
  );
}; 