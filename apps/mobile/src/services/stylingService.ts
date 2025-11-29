/**
 * Styling Service - Virtual Try-On API client
 */

import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface SelectedItem {
    id: string;
    name: string;
    image_url?: string;
}

interface ChatResponse {
    success: boolean;
    message: string;
    image_base64?: string;
    selected_items: SelectedItem[];
    session_id: string;
    error?: string;
}

interface SessionResponse {
    session_id: string;
    message: string;
}

interface ChatHistoryMessage {
    role: 'user' | 'assistant';
    content: string;
    image_url?: string;
    timestamp: string;
    selected_items?: SelectedItem[];
}

interface ChatHistoryResponse {
    session_id: string;
    messages: ChatHistoryMessage[];
}

interface BaseImageResponse {
    success: boolean;
    image_base64: string;
}

// Get auth headers (same pattern as other services)
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

/**
 * Create a new styling session
 */
export const createStylingSession = async (): Promise<SessionResponse> => {
    const headers = await getAuthHeader();
    
    const response = await fetch(`${API_URL}/api/v1/styling/session`, {
        method: 'POST',
        headers,
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create session');
    }
    
    return response.json();
};

/**
 * Send a chat message and get styled image response
 */
export const sendStylingMessage = async (
    sessionId: string,
    message: string
): Promise<ChatResponse> => {
    const headers = await getAuthHeader();
    
    const response = await fetch(`${API_URL}/api/v1/styling/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            session_id: sessionId,
            message: message,
        }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send message');
    }
    
    return response.json();
};

/**
 * Get chat history for a session
 */
export const getChatHistory = async (sessionId: string): Promise<ChatHistoryResponse> => {
    const headers = await getAuthHeader();
    
    const response = await fetch(`${API_URL}/api/v1/styling/history/${sessionId}`, {
        method: 'GET',
        headers,
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get history');
    }
    
    return response.json();
};

/**
 * Delete/clear a styling session
 */
export const deleteStylingSession = async (sessionId: string): Promise<void> => {
    const headers = await getAuthHeader();
    
    const response = await fetch(`${API_URL}/api/v1/styling/session/${sessionId}`, {
        method: 'DELETE',
        headers,
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete session');
    }
};

/**
 * Get the base model image
 */
export const getBaseModelImage = async (): Promise<BaseImageResponse> => {
    const headers = await getAuthHeader();
    
    const response = await fetch(`${API_URL}/api/v1/styling/base-image`, {
        method: 'GET',
        headers,
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get base image');
    }
    
    return response.json();
};

export type { 
    ChatResponse, 
    SessionResponse, 
    ChatHistoryMessage, 
    ChatHistoryResponse,
    SelectedItem,
    BaseImageResponse
};

