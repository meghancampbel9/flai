import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getCartItems, checkout, removeFromCart, addToWishlist } from '../../../services/shopService';
import { Product } from '../../../types/product';
import { cartStyles } from '../styles';

export const CartScreen = () => {
    const [cartItems, setCartItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const items = await getCartItems();
            setCartItems(items);
        } catch (error) {
            console.log('Error', 'Failed to fetch cart items.');
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [fetchCart])
    );

    const handleRemoveItem = async (productId: string) => {
        try {
            await removeFromCart(productId);
            fetchCart();
        } catch (error) {
            Alert.alert('Error', 'Failed to remove item.');
        }
    };

    const handleMoveToWishlist = async (productId: string) => {
        try {
            await addToWishlist(productId);
            await removeFromCart(productId);
            fetchCart(); // Refresh cart
        } catch (error) {
            Alert.alert('Error', 'Failed to move item to wishlist.');
        }
    };

    const handleCheckout = async () => {
        try {
            const result = await checkout();
            Alert.alert('Success', result.message);
            fetchCart(); // Refresh cart to show it's empty
        } catch (error) {
            Alert.alert('Error', 'Checkout failed.');
        }
    };

    const orderSummary = useMemo(() => {
        const subtotal = cartItems.reduce((acc, item) => acc + (item.price || 0), 0);
        return {
            subtotal,
            shipping: 0, // Calculated at checkout
            taxes: 0,    // Included
            total: subtotal,
        };
    }, [cartItems]);

    const renderHeader = () => (
        <View style={cartStyles.listHeader}>
            <Text style={cartStyles.listHeaderText}>ITEMS {String(cartItems.length).padStart(2, '0')}</Text>
            <Text style={cartStyles.listHeaderText}>DESCRIPTION</Text>
            <Text style={cartStyles.listHeaderText}>PRICE</Text>
        </View>
    );

    const renderItem = ({ item }: { item: Product }) => (
        <View style={cartStyles.itemContainer}>
            <Image source={{ uri: item.image_url }} style={cartStyles.itemImage} />
            <View style={cartStyles.itemDetails}>
                <Text style={cartStyles.itemBrand}>{item.brand?.toUpperCase()}</Text>
                <Text style={cartStyles.itemName}>{item.name}</Text>
                {item.sizes?.[0] && <Text style={cartStyles.itemSize}>Size {item.sizes[0]}</Text>}
                {item.is_on_sale && item.original_price && (
                    <Text style={cartStyles.itemDiscount}>
                        {Math.round(((item.original_price - (item.price || 0)) / item.original_price) * 100)}% OFF
                    </Text>
                )}
                <TouchableOpacity onPress={() => handleMoveToWishlist(item.id)}>
                    <Text style={cartStyles.itemActionLink}>MOVE TO WISHLIST</Text>
                </TouchableOpacity>
            </View>
            <View style={cartStyles.itemPriceContainer}>
                <Text style={cartStyles.itemPrice}>€{item.price?.toFixed(2)}</Text>
                {item.is_on_sale && item.original_price && <Text style={cartStyles.itemOriginalPrice}>€{item.original_price.toFixed(2)}</Text>}
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                    <Text style={[cartStyles.itemActionLink, cartStyles.removeLink]}>REMOVE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
    
    if (loading) {
        return <SafeAreaView style={cartStyles.container} edges={['top']}><ActivityIndicator size="large" color="#000" /></SafeAreaView>;
    }

    if (cartItems.length === 0) {
        return (
            <SafeAreaView style={cartStyles.container} edges={['top']}>
                <View style={cartStyles.emptyContainer}>
                    <Text style={cartStyles.title}>SHOPPING BAG</Text>
                    <Text style={cartStyles.emptyText}>Your shopping bag is empty.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={cartStyles.container} edges={['top']}>
            <View style={cartStyles.header}>
                <Text style={cartStyles.title}>SHOPPING BAG</Text>
            </View>
            <FlatList
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item: Product) => item.id}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={
                    <View style={cartStyles.summaryContainer}>
                        <View style={cartStyles.summaryRow}>
                            <Text style={cartStyles.summaryLabel}>Subtotal ({cartItems.length})</Text>
                            <Text style={cartStyles.summaryValue}>€{orderSummary.subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={cartStyles.summaryRow}>
                            <Text style={cartStyles.summaryLabel}>Shipping Total</Text>
                            <Text style={cartStyles.summaryMuted}>Calculated at checkout</Text>
                        </View>
                        <View style={cartStyles.summaryRow}>
                            <Text style={cartStyles.summaryLabel}>Duties and Taxes</Text>
                            <Text style={cartStyles.summaryMuted}>Included</Text>
                        </View>
                        <View style={[cartStyles.summaryRow, cartStyles.totalRow]}>
                            <Text style={cartStyles.summaryLabel}>Order Total (EUR)</Text>
                            <Text style={cartStyles.summaryValue}>€{orderSummary.total.toFixed(2)}</Text>
                        </View>
                    </View>
                }
                style={cartStyles.list}
            />
            <View style={cartStyles.footer}>
                <View>
                    <Text style={cartStyles.footerLabel}>TOTAL ESTIMATE</Text>
                    <Text style={cartStyles.footerTotal}>€{orderSummary.total.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={cartStyles.checkoutButton} onPress={handleCheckout}>
                    <Text style={cartStyles.checkoutButtonText}>GO TO CHECKOUT</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};