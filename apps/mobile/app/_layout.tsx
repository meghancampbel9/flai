import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/features/auth/stores/AuthContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingScreen } from '@/components/LoadingScreen';

function RootLayoutNav() {
  const { session, loading, onboardingCompleted } = useAuth();

  if (loading) {
    return <LoadingScreen/>;
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
      
      {/* User following screens - only accessible when authenticated and onboarded */}
      <Stack.Screen name="user-search" redirect={!session || !onboardingCompleted} />
      <Stack.Screen name="user-profile" redirect={!session || !onboardingCompleted} />
      <Stack.Screen name="user-followers" redirect={!session || !onboardingCompleted} />
      <Stack.Screen name="user-following" redirect={!session || !onboardingCompleted} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
} 