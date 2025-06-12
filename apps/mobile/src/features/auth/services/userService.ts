import { supabase } from '@/config/supabase';
import { Platform } from 'react-native';

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
      console.log('📸 Starting profile image upload...');
      console.log('Image URI:', imageUri);
      console.log('Platform:', Platform.OS);
      
      const userId = await getUserId();
      console.log('User ID:', userId);
      
      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");
      
      // Handle platform-specific URI formats
      let processedUri = imageUri;
      if (Platform.OS === 'android' && imageUri.startsWith('file://')) {
        // Android sometimes needs the file:// prefix removed
        processedUri = imageUri.replace('file://', '');
        console.log('Android: Processed URI:', processedUri);
      }
      
      // First, try to fetch the image to ensure it's accessible
      console.log('Fetching image from URI...');
      let blob: Blob;
      
      try {
        // Try with the original URI first
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Failed with original URI: ${response.status}`);
        }
        blob = await response.blob();
      } catch (originalError) {
        console.log('Failed with original URI, trying processed URI...');
        // If that fails on Android, try without file://
        if (Platform.OS === 'android' && processedUri !== imageUri) {
          try {
            const response = await fetch(processedUri);
            if (!response.ok) {
              throw new Error(`Failed with processed URI: ${response.status}`);
            }
            blob = await response.blob();
          } catch (processedError) {
            console.error('Both URI formats failed');
            throw originalError;
          }
        } else {
          throw originalError;
        }
      }
      
      console.log('Image fetched successfully');
      console.log('Image blob created, size:', blob.size, 'type:', blob.type);
      
      // Validate blob size
      if (blob.size === 0) {
        throw new Error('Image blob is empty');
      }
      
      if (blob.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image size exceeds 5MB limit');
      }
      
      // Generate unique filename with user folder structure
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `users/${userId}/avatar-${Date.now()}.${fileExt}`;
      console.log('Generated filename:', fileName);
      
      // MIME types for images
      const mimeType = blob.type || (
        fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' : 
        fileExt === 'png' ? 'image/png' :
        fileExt === 'webp' ? 'image/webp' : 'image/jpeg'
      );
      console.log('MIME type:', mimeType);

      // Check if we have a valid Supabase client
      console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      console.log('Has Supabase client:', !!supabase);
      console.log('Has storage client:', !!supabase.storage);

      // Try using Supabase client first
      console.log('Attempting upload via Supabase client...');
      try {
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: mimeType,
            upsert: true,
          });

        if (error) {
          console.error('Supabase client upload error:', error);
          throw error;
        }

        console.log('Upload successful via Supabase client:', data);
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        console.log('Public URL:', publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
        
      } catch (supabaseError) {
        console.log('Supabase client failed, trying direct REST API...');
        
        // Fallback to direct REST API call
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const uploadUrl = `${supabaseUrl}/storage/v1/object/avatars/${fileName}`;
        
        console.log('Upload URL:', uploadUrl);
        
        try {
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
              'Content-Type': mimeType,
            },
            body: blob,
          });
          
          console.log('REST API response status:', uploadResponse.status);
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('REST API upload error:', errorText);
            throw new Error(`REST API upload failed: ${uploadResponse.status} - ${errorText}`);
          }
          
          const uploadResult = await uploadResponse.json();
          console.log('REST API upload successful:', uploadResult);
          
          // Construct public URL
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${fileName}`;
          console.log('Public URL:', publicUrl);
          return publicUrl;
          
        } catch (restError) {
          console.error('REST API upload also failed:', restError);
          throw supabaseError; // Throw original error
        }
      }

    } catch (error) {
      console.error('❌ Failed to upload profile image:', error);
      console.error('Error type:', (error as any)?.constructor?.name);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Network error: Please check your internet connection and try again.');
      }
      
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