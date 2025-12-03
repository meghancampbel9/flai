import { supabase } from '../config/supabase';
import { Product } from '../types/product';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

export const getStyleRecommendations = async (
    match_threshold: number = 0.75,
    match_count: number = 20
): Promise<Product[]> => {
    try {
        const headers = await getAuthHeader();
        const response = await fetch(
            `${API_URL}/api/v1/products/recommendations?match_threshold=${match_threshold}&match_count=${match_count}`,
            { headers }
        );

        if (response.status === 401) {
            throw new Error("Unauthorized");
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData.detail);
            throw new Error("Failed to fetch style recommendations");
        }

        return response.json();
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        // Don't throw for auth errors, just return empty
        if (error instanceof Error && (error.message === "Unauthorized" || error.message === "User not authenticated")) {
            return [];
        }
        throw error;
    }
}; 