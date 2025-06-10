const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await fetch(`${API_URL}/api/v1/users/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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

  async updateUserProfile(userId: string, updates: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
  }): Promise<UserServiceResponse> {
    try {
      const response = await fetch(`${API_URL}/api/v1/users/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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

  async completeOnboarding(userId: string): Promise<UserServiceResponse> {
    try {
      const response = await fetch(`${API_URL}/api/v1/users/profile/${userId}/complete-onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  async getUserStylePreferences(userId: string): Promise<StylePreference[]> {
    try {
      const response = await fetch(`${API_URL}/api/v1/pinterest/analyzed-images/${userId}?limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // No analyzed images found
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

  async updatePinterestBoard(userId: string, pinterestBoardUrl: string): Promise<UserServiceResponse> {
    try {
      const response = await fetch(`${API_URL}/api/v1/users/profile/${userId}/pinterest-board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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