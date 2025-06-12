import { supabase } from '@/config/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("session",`${session}`)
    if (!session) throw new Error("User not authenticated");
    console.log("no error returning",`${session}`)
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    };
};

const getUserId = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) throw new Error("User not authenticated");
    return session.user.id;
};

export interface CreateUserProfileRequest {
  user_id: string;
  username: string;
  display_name?: string;
  bio?: string;
  phone_number?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  phone_number?: string;
  shopping_preference?: string;
  onboarding_completed: boolean;
  pinterest_board_analyzed?: string;
  created_at: string;
  updated_at: string;
}

export interface StylePreference {
  id: string;
  aesthetic_description?: string;
  style_keywords: string[];
  color_palette: string[];
  themes: string[];
  confidence_score?: number;
  source_board_url?: string;
  images_analyzed: number;
  analysis_date: string;
}

export interface UserServiceResponse {
  success: boolean;
  message: string;
  profile_id?: string;
}

export interface UsernameCheckResponse {
  username: string;
  available: boolean;
}

export const userService = {
  async createUserProfile(data: CreateUserProfileRequest): Promise<UserServiceResponse> {
    try {
      console.log("attemtping get user")
      const response = await fetch(`${API_URL}/api/v1/users/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ User profile created successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to create user profile:', error);
      throw new Error('Failed to create user profile. Please try again.');
    }
  },

  async getUserProfile(): Promise<UserProfile> {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/v1/users/profile`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          // This is expected during first-time signup - don't log as error
          throw new Error('PROFILE_NOT_FOUND');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const profile = await response.json();
      console.log('✅ User profile fetched successfully');
      return profile;
    } catch (error) {
      if (error instanceof Error && error.message === 'PROFILE_NOT_FOUND') {
        throw error;
      }
      console.error('❌ Failed to fetch user profile:', error);
      throw error;
    }
  },

  async updateUserProfile(updates: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    shopping_preference?: string;
  }): Promise<UserServiceResponse> {
    try {
      // Prevent API call if there are no actual updates
      if (Object.keys(updates).length === 0) {
        console.log('⚠️ Attempted to update profile with no new data. Skipping.');
        return { success: true, message: "No updates provided." };
      }

      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/v1/users/profile`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ User profile updated successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      throw new Error('Failed to update user profile. Please try again.');
    }
  },

  async completeOnboarding(): Promise<UserServiceResponse> {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/v1/users/profile/complete-onboarding`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Onboarding completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to complete onboarding:', error);
      throw new Error('Failed to complete onboarding. Please try again.');
    }
  },

  async checkUsernameAvailability(username: string): Promise<UsernameCheckResponse> {
    try {
      const response = await fetch(`${API_URL}/api/v1/users/check-username/${encodeURIComponent(username)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Username availability checked: ${username} - ${result.available ? 'Available' : 'Taken'}`);
      return result;
    } catch (error) {
      console.error('❌ Failed to check username availability:', error);
      throw new Error('Failed to check username availability. Please try again.');
    }
  },

  async getUserStylePreferences(): Promise<StylePreference[]> {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/v1/users/profile/style-preferences`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) {
          return []; // No analyzed images found or unauthorized
        }
        throw new Error(`API error: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log('✅ Analyzed images fetched successfully:', apiResponse.images?.length || 0, 'images');
      
      // If no images, return empty array
      if (!apiResponse.success || !apiResponse.images || apiResponse.images.length === 0) {
        return [];
      }
      
      const analyzedImages = apiResponse.images;
      
      // Aggregate style data from analyzed images
      const styleKeywords = new Set<string>();
      const detectedColors = new Set<string>();
      const themes = new Set<string>();
      let totalConfidence = 0;
      let confidenceCount = 0;
      
      // Extract unique style data from all analyzed images
      analyzedImages.forEach((image: any) => {
        if (image.detected_styles) {
          image.detected_styles.forEach((style: string) => styleKeywords.add(style));
        }
        if (image.detected_colors) {
          image.detected_colors.forEach((color: string) => detectedColors.add(color));
        }
        if (image.dominant_mood) {
          themes.add(image.dominant_mood);
        }
        if (image.analysis_confidence != null) {
          totalConfidence += image.analysis_confidence;
          confidenceCount++;
        }
      });
      
      // Create aggregated style preference
      const userId = analyzedImages[0]?.user_id || 'unknown';
      const aggregatedPreference: StylePreference = {
        id: `aggregated-${userId}`,
        aesthetic_description: `Style analysis based on ${analyzedImages.length} Pinterest images`,
        style_keywords: Array.from(styleKeywords).slice(0, 10), // Limit to 10 keywords
        color_palette: Array.from(detectedColors).slice(0, 7), // Limit to 7 colors
        themes: Array.from(themes).slice(0, 7), // Limit to 7 themes
        confidence_score: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
        source_board_url: '', // comes from user profile
        images_analyzed: analyzedImages.length,
        analysis_date: analyzedImages[0]?.created_at || new Date().toISOString()
      };
      
      return [aggregatedPreference];
    } catch (error) {
      console.error('❌ Failed to fetch style preferences:', error);
      throw error;
    }
  },

  async uploadProfileImage(imageUri: string): Promise<string> {
    try {
      const userId = await getUserId();
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Failed to read image file: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      
      // Generate unique filename with user folder structure
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `users/${userId}/avatar-${Date.now()}.${fileExt}`;
      
      // MIME types for images
      const mimeType = fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' : 
                      fileExt === 'png' ? 'image/png' :
                      fileExt === 'webp' ? 'image/webp' : 'image/jpeg';

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('❌ Failed to upload profile image:', error);
      throw new Error('Failed to upload profile image. Please try again.');
    }
  },

  async updatePinterestBoard(pinterestBoardUrl: string): Promise<UserServiceResponse> {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/v1/users/profile/pinterest-board`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ pinterest_board_url: pinterestBoardUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Pinterest board updated successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to update Pinterest board:', error);
      throw new Error('Failed to update Pinterest board. Please try again.');
    }
  },
}; 