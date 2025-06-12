import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/features/auth/stores/AuthContext';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Import dev tools in development
if (__DEV__) {
  require('@/utils/devTools');
}

function RootLayoutNav() {
  const { session, loading, onboardingCompleted } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* If the user is signed in and has completed onboarding, redirect them away from auth pages. */}
      <Stack.Screen name="index" redirect={!!session && onboardingCompleted} />
      <Stack.Screen name="auth/phone" redirect={!!session && onboardingCompleted} />
      <Stack.Screen name="auth/verify" redirect={!!session && onboardingCompleted} />
      <Stack.Screen name="auth/welcome" redirect={!!session && onboardingCompleted} />
      
      {/* Allow username, shopping preference and pinterest screens if user has session but hasn't completed onboarding */}
      <Stack.Screen name="auth/username" redirect={!!session && onboardingCompleted} />
      <Stack.Screen name="auth/shopping-preference" redirect={!!session && onboardingCompleted} />
      <Stack.Screen name="auth/pinterest" redirect={!!session && onboardingCompleted} />

      {/* If the user is not signed in OR hasn't completed onboarding, redirect them away from the app pages. */}
      <Stack.Screen name="dashboard" redirect={!session || !onboardingCompleted} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
} 