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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Product } from '../../../types/product';
import { colors } from '../../../styles';
import { API_URL } from '@/config/api';
import { productStyles } from '../styles/index';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Constants for panel states
const SNAP_POINTS = {
  CLOSED: screenHeight - 210,
  FULL: 100,
};

const VELOCITY_THRESHOLD = 0.5; // Increase for less sensitive swipes
const HANDLE_HEIGHT = 50; // Height of draggable handle area

interface ProductDetailScreenProps {
  id: string;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ id }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(SNAP_POINTS.CLOSED);
  
  // Animation values
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
    
    // Reset panel position and fetch product
    translateY.setValue(SNAP_POINTS.CLOSED);
    setCurrentSnapPoint(SNAP_POINTS.CLOSED);
    fetchProduct();
    
    // Cleanup function
    return () => {
      abortController.abort();
      // Cancel any pending animations
      translateY.stopAnimation();
    };
  }, [id, translateY]);

  const formatPrice = useCallback((price: number, currency: string) => {
    // Handle currency symbols vs ISO codes
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

  const getClosestSnapPoint = useCallback((y: number) => {
    'worklet';
    const snapPoints = [SNAP_POINTS.CLOSED, SNAP_POINTS.FULL];
    return snapPoints.reduce((prev, curr) => 
      Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev
    );
  }, []);

  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, 
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isDraggingHandle = evt.nativeEvent.locationY < HANDLE_HEIGHT; // Only fragfrom handle area
        const isSignificantVerticalMove = Math.abs(gestureState.dy) > 10; // Increased threshold for drag force
        const isVerticalGesture = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        
        // When expanded, only allow dragging from handle unless scrolled to top
        if (currentSnapPoint === SNAP_POINTS.FULL) {
          return isDraggingHandle && isSignificantVerticalMove && isVerticalGesture;
        }
        
        // When not fully expanded, allow dragging from anywhere
        return isSignificantVerticalMove && isVerticalGesture && !isScrolling.current;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(currentSnapPoint);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down when at full height, or up when not at full
        const newValue = currentSnapPoint + gestureState.dy;
        
        // Prevent dragging beyond bounds
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
        
        // Velocity-based default snap points
        if (Math.abs(vy) > VELOCITY_THRESHOLD) {
          if (vy > 0) {
            // Swiping down - always go to closed
            targetSnapPoint = SNAP_POINTS.CLOSED;
          } else {
            // Swiping up - always go to full
            targetSnapPoint = SNAP_POINTS.FULL;
          }
        } else {
          // Position-based snapping - snap to closest (closed or full)
          const midPoint = (SNAP_POINTS.CLOSED + SNAP_POINTS.FULL) / 2;
          targetSnapPoint = currentPosition > midPoint ? SNAP_POINTS.CLOSED : SNAP_POINTS.FULL;
        }
        
        // Haptic feedback on state change
        if (targetSnapPoint !== currentSnapPoint) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        animateToPoint(targetSnapPoint);
      },
    }), [currentSnapPoint, translateY, getClosestSnapPoint, animateToPoint]
  );

  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtTop = contentOffset.y <= 0;
    const isAtBottom = contentOffset.y >= contentSize.height - layoutMeasurement.height;
    
    // Only allow panel drag when scrolled to top or bottom
    isScrolling.current = !isAtTop && !isAtBottom;
  }, []);

  const showComingSoonAlert = () => {
    Alert.alert('Coming Soon', 'This functionality is under development.');
  };

  const handleAddToCart = useCallback(() => {
    showComingSoonAlert();
  }, []);

  const handleToggleWishlist = useCallback(() => {
    showComingSoonAlert();
  }, []);

  const handleShare = useCallback(async () => {
    if (!product) return;
    
    try {
      // Implement actual share logic
      Alert.alert('Share', 'Share functionality would go here');
    } catch (error) {
      Alert.alert('Error', 'Failed to share product');
    }
  }, [product]);

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
      
      {/* Fixed Header */}
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
        
        {/* <View style={productStyles.headerActions}>
          <TouchableOpacity 
            accessibilityRole="button"
            accessibilityLabel="View cart"
            style={productStyles.headerButton}
            onPress={showComingSoonAlert}
          >
            <Ionicons name="cart-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View> */}
      </SafeAreaView>

      {/* Product Image - Behind the panel */}
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
            setImageLoading(false); // Important: stop loading on error
          }}
          accessibilityLabel={`${product.name} image`}
        />
      </View>

      {/* Draggable Bottom Panel */}
       <Animated.View 
        style={[productStyles.bottomPanel, animatedStyle]}
         {...panResponder.panHandlers}
        accessible={true}
        accessibilityRole="adjustable"
        accessibilityLabel="Product details panel. Swipe up to expand, swipe down to collapse"
       >
        {/* Drag Handle */}
        <View style={productStyles.handleContainer}>
           <View style={productStyles.handle} />
        </View>
         
        {/* Scrollable Content */}
        <ScrollView 
          ref={scrollViewRef}
          style={productStyles.panelScrollView}
          contentContainerStyle={productStyles.panelContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={currentSnapPoint === SNAP_POINTS.FULL}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={false}
        >
          {/* Basic Product Info */}
          <View style={productStyles.productHeader}>
            <View style={productStyles.productInfo}>
          <Text style={productStyles.brandName}>{product.brand}</Text>
          <Text style={productStyles.productName}>{product.name}</Text>
          {renderPricing()}
            </View>
          </View>
          
          {/* Quick Action Buttons */}
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
              onPress={handleToggleWishlist}
              accessibilityRole="button"
              accessibilityLabel={"Add to wishlist"}
            >
              <Text style={productStyles.wishlistButtonText}>ADD TO WISHLIST</Text>
            </TouchableOpacity>
          </View>

          {/* Detailed Content - Visible when expanded */}
          {currentSnapPoint !== SNAP_POINTS.CLOSED && (
            <>
              {/* Size Selector */}
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

              {/* Product Details */}
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