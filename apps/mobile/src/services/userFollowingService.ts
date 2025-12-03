import { supabase } from '@/config/supabase';
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

export interface UserProfile {
    user_id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    followers_count: number;
    following_count: number;
    is_following: boolean;
}

export interface UserSearchResult {
    user_id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    followers_count: number;
    following_count: number;
}

export interface FollowResponse {
    success: boolean;
    message: string;
    is_following: boolean;
}

export interface FollowersResponse {
    followers: UserProfile[];
    total_count: number;
    has_more: boolean;
}

export interface FollowingResponse {
    following: UserProfile[];
    total_count: number;
    has_more: boolean;
}

export const userFollowingService = {
    async searchUsers(query: string, limit: number = 20, offset: number = 0): Promise<UserSearchResult[]> {
        try {
            const headers = await getAuthHeader();
            const response = await fetch(
                `${API_URL}/api/v1/users/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`,
                {
                    method: 'GET',
                    headers: headers,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Failed to search users:', error);
            throw new Error('Failed to search users. Please try again.');
        }
    },

    async getUserProfile(userId: string): Promise<UserProfile> {
        try {
            const headers = await getAuthHeader();
            const response = await fetch(`${API_URL}/api/v1/users/profile/${userId}`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Failed to get user profile:', error);
            throw new Error('Failed to get user profile. Please try again.');
        }
    },

    async followUser(userId: string): Promise<FollowResponse> {
        try {
            const headers = await getAuthHeader();
            const response = await fetch(`${API_URL}/api/v1/users/follow`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ user_id: userId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Failed to follow user:', error);
            throw new Error('Failed to follow user. Please try again.');
        }
    },

    async unfollowUser(userId: string): Promise<FollowResponse> {
        try {
            const headers = await getAuthHeader();
            const response = await fetch(`${API_URL}/api/v1/users/follow/${userId}`, {
                method: 'DELETE',
                headers: headers,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Failed to unfollow user:', error);
            throw new Error('Failed to unfollow user. Please try again.');
        }
    },

    async getUserFollowers(userId: string, limit: number = 20, offset: number = 0): Promise<FollowersResponse> {
        try {
            const headers = await getAuthHeader();
            const response = await fetch(
                `${API_URL}/api/v1/users/followers/${userId}?limit=${limit}&offset=${offset}`,
                {
                    method: 'GET',
                    headers: headers,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Failed to get followers:', error);
            throw new Error('Failed to get followers. Please try again.');
        }
    },

    async getUserFollowing(userId: string, limit: number = 20, offset: number = 0): Promise<FollowingResponse> {
        try {
            const headers = await getAuthHeader();
            const response = await fetch(
                `${API_URL}/api/v1/users/following/${userId}?limit=${limit}&offset=${offset}`,
                {
                    method: 'GET',
                    headers: headers,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Failed to get following:', error);
            throw new Error('Failed to get following. Please try again.');
        }
    },
};
