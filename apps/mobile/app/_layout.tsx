import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/features/auth/stores/AuthContext';
import { useAuth } from '@/features/auth/hooks/useAuth';

function RootLayoutNav() {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* If the user is signed in, redirect them away from the auth pages. */}
      <Stack.Screen name="index" redirect={!!session} />
      <Stack.Screen name="auth/phone" redirect={!!session} />
      <Stack.Screen name="auth/verify" redirect={!!session} />
      <Stack.Screen name="auth/welcome" redirect={!!session} />

      {/* If the user is not signed in, redirect them away from the app pages. */}
      <Stack.Screen name="dashboard" redirect={!session} />
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