const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn(
    '⚠️ EXPO_PUBLIC_API_URL is not set. Defaulting to http://localhost:8000. ' +
    'Create apps/mobile/.env file to configure the API endpoint.'
  );
}

const API_URL = `${BASE_URL}/api/v1`;

export { API_URL }; 