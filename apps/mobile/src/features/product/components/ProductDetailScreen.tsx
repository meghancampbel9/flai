import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
  PanResponder,
  ActivityIndicator,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Product } from '../../../types/product';
import { colors } from '../../../styles';
import { API_URL } from '@/config/api';
import { productStyles } from '../styles/index';
import { addToCart, addToWishlist } from '../../../services/shopService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Constants for panel states
const SNAP_POINTS = {
  CLOSED: screenHeight - 210,
  FULL: 100,
};

const VELOCITY_THRESHOLD = 0.5;
const HANDLE_HEIGHT = 50;

export const ProductDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(SNAP_POINTS.CLOSED);

  const translateY = useRef(new Animated.Value(SNAP_POINTS.CLOSED)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setProduct(null);
        setImageLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/products/${id}`, {
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) return;

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found.');
          }
          throw new Error('Failed to load product details.');
        }
        
        const foundProduct: Product = await response.json();
        
        if (!abortController.signal.aborted) {
          setProduct(foundProduct);
        }
      } catch (error: any) {
        if (!abortController.signal.aborted) {
          console.error('Failed to load product:', error);
          setError(error.message || 'An unexpected error occurred.');
          setProduct(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    translateY.setValue(SNAP_POINTS.CLOSED);
    setCurrentSnapPoint(SNAP_POINTS.CLOSED);
    fetchProduct();
    
    return () => {
      abortController.abort();
      translateY.stopAnimation();
    };
  }, [id, translateY]);

  const handleAddToCart = async () => {
    if (product) {
      try {
        await addToCart(product.id);
        Alert.alert('Success', 'Added to bag!');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to add to bag.');
      }
    }
  };

  const handleAddToWishlist = async () => {
    if (product) {
      try {
        await addToWishlist(product.id);
        Alert.alert('Success', 'Added to wishlist!');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to add to wishlist.');
      }
    }
  };

  const formatPrice = useCallback((price: number, currency: string) => {
    const currencyMap: Record<string, string> = {
      '€': 'EUR',
      '$': 'USD',
      '£': 'GBP',
      '¥': 'JPY',
      'EUR': 'EUR',
      'USD': 'USD',
      'GBP': 'GBP',
      'JPY': 'JPY'
    };
    
    const currencyCode = currencyMap[currency] || 'USD';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    } catch (error) {
      console.warn('Invalid currency:', currency, error);
      return `${currency}${price}`;
    }
  }, []);

  const animateToPoint = useCallback((toValue: number, callback?: () => void) => {
    Animated.timing(translateY, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentSnapPoint(toValue);
      if (callback) callback();
    });
  }, [translateY]);

  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, 
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isDraggingHandle = evt.nativeEvent.locationY < HANDLE_HEIGHT;
        const isSignificantVerticalMove = Math.abs(gestureState.dy) > 10;
        const isVerticalGesture = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        
        if (currentSnapPoint === SNAP_POINTS.FULL) {
          return isDraggingHandle && isSignificantVerticalMove && isVerticalGesture;
        }
        
        return isSignificantVerticalMove && isVerticalGesture && !isScrolling.current;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(currentSnapPoint);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = currentSnapPoint + gestureState.dy;
        
        if (newValue < SNAP_POINTS.FULL) {
          translateY.setValue(SNAP_POINTS.FULL - currentSnapPoint);
        } else if (newValue > SNAP_POINTS.CLOSED) {
          translateY.setValue(SNAP_POINTS.CLOSED - currentSnapPoint);
        } else {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        
        const { dy, vy } = gestureState;
        const currentPosition = currentSnapPoint + dy;
        
        let targetSnapPoint;
        
        if (Math.abs(vy) > VELOCITY_THRESHOLD) {
          targetSnapPoint = vy > 0 ? SNAP_POINTS.CLOSED : SNAP_POINTS.FULL;
        } else {
          const midPoint = (SNAP_POINTS.CLOSED + SNAP_POINTS.FULL) / 2;
          targetSnapPoint = currentPosition > midPoint ? SNAP_POINTS.CLOSED : SNAP_POINTS.FULL;
        }
        
        if (targetSnapPoint !== currentSnapPoint) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        animateToPoint(targetSnapPoint);
      },
    }), [currentSnapPoint, translateY, animateToPoint]
  );

  const handleScroll = useCallback((event: React.UIEvent<ScrollView>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtTop = contentOffset.y <= 0;
    const isAtBottom = contentOffset.y >= contentSize.height - layoutMeasurement.height;
    
    isScrolling.current = !isAtTop && !isAtBottom;
  }, []);

  const renderPricing = useCallback(() => {
    if (!product) return null;
    
    if (product.is_on_sale && product.original_price) {
      const discount = Math.round((1 - product.price / product.original_price) * 100);
      return (
        <View style={productStyles.pricingContainer} accessible={true} accessibilityLabel={`Sale price ${formatPrice(product.price, product.currency)}, original price ${formatPrice(product.original_price, product.currency)}, ${discount}% off`}>
          <Text style={productStyles.salePrice}>
            {formatPrice(product.price, product.currency)}
          </Text>
          <Text style={productStyles.originalPrice}>
            {formatPrice(product.original_price, product.currency)}
          </Text>
          <Text style={productStyles.discountText}>{discount}% OFF</Text>
        </View>
      );
    }
    
      return (
      <Text style={productStyles.price} accessibilityLabel={`Price ${formatPrice(product.price, product.currency)}`}>
          {formatPrice(product.price, product.currency)}
        </Text>
      );
  }, [product, formatPrice]);

  if (loading) {
    return (
      <View style={productStyles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={productStyles.loadingText}>Loading Product...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={productStyles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={productStyles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={productStyles.backButton}>
          <Text style={productStyles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={productStyles.centered}>
        <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
        <Text style={productStyles.errorText}>Product could not be found.</Text>
         <TouchableOpacity onPress={() => router.back()} style={productStyles.backButton}>
          <Text style={productStyles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const animatedStyle = {
    transform: [{ translateY }],
  };

  return (
    <View style={[productStyles.container, { zIndex: 1000 }]}>
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView style={productStyles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={productStyles.imageContainer}>
        {imageLoading && (
          <View style={productStyles.imageLoadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        <Image
          style={productStyles.productDetailImage}
          source={{ uri: product.image_url }}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={(e) => {
            console.error('[Image] Load Error:', e.nativeEvent.error);
            setImageLoading(false);
          }}
          accessibilityLabel={`${product.name} image`}
        />
      </View>

       <Animated.View 
        style={[productStyles.bottomPanel, animatedStyle]}
         {...panResponder.panHandlers}
        accessible={true}
        accessibilityRole="adjustable"
        accessibilityLabel="Product details panel. Swipe up to expand, swipe down to collapse"
       >
        <View style={productStyles.handleContainer}>
           <View style={productStyles.handle} />
        </View>
         
        <ScrollView 
          ref={scrollViewRef}
          style={productStyles.panelScrollView}
          contentContainerStyle={productStyles.panelContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={currentSnapPoint === SNAP_POINTS.FULL}
          onScroll={handleScroll as any}
          scrollEventThrottle={16}
          bounces={false}
        >
          <View style={productStyles.productHeader}>
            <View style={productStyles.productInfo}>
          <Text style={productStyles.brandName}>{product.brand}</Text>
          <Text style={productStyles.productName}>{product.name}</Text>
          {renderPricing()}
            </View>
          </View>
          
          <View style={productStyles.quickActions}>
            <TouchableOpacity 
              style={productStyles.addToCartButton} 
              onPress={handleAddToCart}
              accessibilityRole="button"
              accessibilityLabel="Add to bag"
            >
              <Text style={productStyles.addToCartText}>
                ADD TO BAG
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={productStyles.wishlistButton}
              onPress={handleAddToWishlist}
              accessibilityRole="button"
              accessibilityLabel="Add to wishlist"
            >
              <Text style={productStyles.wishlistButtonText}>ADD TO WISHLIST</Text>
            </TouchableOpacity>
          </View>

          {currentSnapPoint !== SNAP_POINTS.CLOSED && (
            <>
              <View style={productStyles.section}>
                <Text style={productStyles.sectionTitle}>SELECT SIZE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={productStyles.sizeSelector}>
                  {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                    <TouchableOpacity 
                      key={size} 
                      style={productStyles.sizeOption}
                      accessibilityRole="button"
                      accessibilityLabel={`Size ${size}`}
                    >
                      <Text style={productStyles.sizeText}>{size}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={productStyles.section}>
                <Text style={productStyles.sectionTitle}>PRODUCT DETAILS</Text>
                <Text style={productStyles.description}>
                  {product.description}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}