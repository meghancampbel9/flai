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
  async analyzeBoard(boardUrl: string, userId: string): Promise<PinterestAnalysisResponse> {
    try {
      const response = await fetch(`${API_URL}/api/v1/pinterest/analyze-board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: boardUrl, user_id: userId }),
      });

      // Handle non-200 responses gracefully
      if (!response.ok) {
        // Try to parse the error response from the server
        try {
          const errorData = await response.json();
          return {
            success: false,
            message: errorData.detail || `Server returned an error: ${response.status}`,
            validation_error: true, // Treat all server errors as validation issues for the UI
          };
        } catch (e) {
          // If parsing fails, return a generic error
          return {
            success: false,
            message: `Unable to connect to API server. Status: ${response.status}`,
            validation_error: true,
          };
        }
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Pinterest API request failed:', error);
      return {
        success: false,
        message: 'A network error occurred. Please check your connection.',
        validation_error: false
      };
    }
  },
}; 