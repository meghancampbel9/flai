const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface StyleAnalysis {
  aesthetic_description: string;
  style_keywords: string[];
  color_palette: string[];
  themes: string[];
  confidence_score: number;
}

export interface PinterestAnalysisResponse {
  success: boolean;
  style_analysis?: StyleAnalysis;
  message: string;
  validation_error?: boolean;
}

export const pinterestService = {
  async analyzeBoard(url: string, userId: string): Promise<PinterestAnalysisResponse> {
    const payload = {
      url,
      user_id: userId,
    };
    console.log(`🎨 Analyzing Pinterest board with url ${payload.url} and user_id ${payload.user_id}`);

    try {
      const response = await fetch(`${API_URL}/api/v1/pinterest/analyze-board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          if (response.status === 400 && errorData.detail) {
            return {
              success: false,
              message: errorData.detail,
              validation_error: true
            };
          } else {
            throw new Error(errorData.detail || `API error: ${response.status}`);
          }
        } catch (parseError) {
          throw new Error(`API error: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('✅ Pinterest API response received');
      
      if (data.style_analysis) {
        console.log('🎨 Style Analysis Result:');
        console.log('📝 Description:', data.style_analysis.aesthetic_description);
        console.log('🏷️ Keywords:', data.style_analysis.style_keywords);
        console.log('🎨 Colors:', data.style_analysis.color_palette);
        console.log('🎯 Themes:', data.style_analysis.themes);
        console.log('📊 Confidence:', data.style_analysis.confidence_score);
      }
      return data;
    } catch (error) {
      console.error('❌ Pinterest API request failed:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Unable to connect to API server. Please ensure it is running.');
    }
  },
}; 