import { supabase } from '../config/supabase';
import { Product } from '../types/product';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

// Helper functions to get user ID and auth headers
const getUserId = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user.id;
    
    // Fall back to dev mode
    const devMode = await AsyncStorage.getItem('devMode');
    if (devMode === 'true') return DEV_USER_ID;
    
    throw new Error("User not authenticated");
};

const getAuthHeader = async () => {
    // First try to get real Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };
    }
    
    // Fall back to dev mode token
    const devMode = await AsyncStorage.getItem('devMode');
    if (devMode === 'true') {
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer dev-token'
        };
    }
    
    throw new Error("User not authenticated");
};

export const getCartItems = async (): Promise<Product[]> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/v1/shop/cart/items`, { headers });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error("Failed to fetch cart items");
    return response.json();
};

export const addToCart = async (productId: string, quantity: number = 1): Promise<void> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/v1/shop/cart/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ product_id: productId, quantity })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to add item to cart');
    }
};

export const removeFromCart = async (productId: string): Promise<void> => {
    const headers = await getAuthHeader();
    await fetch(`${API_URL}/api/v1/shop/cart/items/${productId}`, {
        method: 'DELETE',
        headers
    });
};

export const checkout = async (): Promise<{ message: string }> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/v1/shop/cart/checkout`, {
        method: 'POST',
        headers
    });
    if (!response.ok) throw new Error("Checkout failed");
    return response.json();
};

export const getWishlistItems = async (): Promise<Product[]> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/v1/shop/wishlist/items`, { headers });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error("Failed to fetch wishlist items");
    return response.json();
};

export const addToWishlist = async (productId: string): Promise<void> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/v1/shop/wishlist/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ product_id: productId })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to add item to wishlist');
    }
};

export const removeFromWishlist = async (productId: string): Promise<void> => {
    const headers = await getAuthHeader();
    await fetch(`${API_URL}/api/v1/shop/wishlist/items/${productId}`, {
        method: 'DELETE',
        headers
    });
};

export const getClosetItems = async (): Promise<Product[]> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/v1/shop/closet/items`, { headers });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error("Failed to fetch closet items");
    return response.json();
}; 