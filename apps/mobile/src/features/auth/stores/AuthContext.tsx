import React, { createContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, AuthProviderProps, Session } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  onboardingCompleted: false,
  signOut: async () => {},
  setDevModeAuth: () => {},
  markOnboardingCompleted: () => {},
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Function to check if user has completed onboarding
  const checkOnboardingStatus = useCallback(async (userId: string) => {
    try {
      const profile = await userService.getUserProfile();
      const completed = profile.onboarding_completed;
      setOnboardingCompleted(completed);
    } catch (error) {
      if (error instanceof Error && error.message === 'PROFILE_NOT_FOUND') {
        // New user - profile not found, start onboarding flow
      } else {
        // Could not fetch user profile
      }
      setOnboardingCompleted(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { session } = await authService.getSession();
        if (!isMounted) return;
        
        // Validate session if it exists
        if (session) {
          try {
            // Try to get the user to validate the session
            const { user, error } = await authService.getCurrentUser();
            if (error || !user) {
              // Clear invalid session
              await authService.signOut();
              setSession(null);
              setUser(null);
              setOnboardingCompleted(false);
              setLoading(false);
              return;
            }
            
            // Validate user exists in database
            try {
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/profile/debug`, {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                await authService.signOut();
                setSession(null);
                setUser(null);
                setOnboardingCompleted(false);
                setLoading(false);
                return;
              }
              
              const debugData = await response.json();
              
              if (!debugData.exists_in_auth_users) {
                await authService.signOut();
                setSession(null);
                setUser(null);
                setOnboardingCompleted(false);
                setLoading(false);
                return;
              }
            } catch (err) {
              await authService.signOut();
              setSession(null);
              setUser(null);
              setOnboardingCompleted(false);
              setLoading(false);
              return;
            }
            
            // Additional validation: Try to get profile to ensure user exists
            let hasProfile = false;
            try {
              const profile = await userService.getUserProfile();
              hasProfile = true;
            } catch (err: any) {
              if (err.message !== 'PROFILE_NOT_FOUND') {
                await authService.signOut();
                setSession(null);
                setUser(null);
                setOnboardingCompleted(false);
                setLoading(false);
                return;
              }
              // PROFILE_NOT_FOUND is OK - user exists but hasn't created profile yet
            }
            
            // If we get here, session is valid
            setSession(session);
            setUser(session.user ?? null);
            
            // Only check onboarding after validation
            if (session.user?.id && hasProfile) {
              await checkOnboardingStatus(session.user.id);
            } else {
              setOnboardingCompleted(false);
              setLoading(false);
            }
          } catch (error) {
            await authService.signOut();
            setSession(null);
            setUser(null);
            setOnboardingCompleted(false);
            setLoading(false);
            return;
          }
        } else {
          // No session
          setSession(null);
          setUser(null);
          setOnboardingCompleted(false);
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    };
    
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          setOnboardingCompleted(false);
          setLoading(false);
        } else if (session?.user?.id && event === 'SIGNED_IN' && !loading) {
          // Only check onboarding for new sign-ins, not during initial load
          await checkOnboardingStatus(session.user.id);
        }
      }
    );
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
    // Clear dev mode flag
    await AsyncStorage.removeItem('devMode');
    
    if (session?.user?.id === DEV_USER_ID) {
      setSession(null);
      setUser(null);
      setOnboardingCompleted(false);
    } else {
      await authService.signOut();
      setSession(null);
      setUser(null);
      setOnboardingCompleted(false);
    }
  }, [session]);

  const setDevModeAuth = useCallback(async () => {
    // Use a valid UUID for dev mode (this is a fixed test UUID)
    const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
    const mockSession = {
      access_token: 'dev-token',
      refresh_token: 'dev-refresh',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
      user: {
        id: DEV_USER_ID,
        email: 'dev@example.com',
        phone: '+491799004465',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      }
    } as Session;
    
    // Store dev mode flag for userService to use
    await AsyncStorage.setItem('devMode', 'true');
    
    setSession(mockSession);
    setUser(mockSession.user);
    setOnboardingCompleted(false);
    setLoading(false);
  }, []);

  const markOnboardingCompleted = useCallback(() => {
    setOnboardingCompleted(true);
  }, []);

  const value = {
    session,
    user,
    loading,
    onboardingCompleted,
    signOut,
    setDevModeAuth,
    markOnboardingCompleted,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 