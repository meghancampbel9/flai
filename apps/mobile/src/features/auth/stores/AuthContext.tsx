import React, { createContext, useEffect, useState, useCallback } from 'react';
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

  console.log('🔄 AuthProvider render - session:', session?.user?.id, 'loading:', loading);

  // Function to check if user has completed onboarding
  const checkOnboardingStatus = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Checking onboarding status for user:', userId);
      const profile = await userService.getUserProfile(userId);
      const completed = profile.onboarding_completed;
      console.log('✅ Onboarding completed:', completed);
      setOnboardingCompleted(completed);
    } catch (error) {
      if (error instanceof Error && error.message === 'PROFILE_NOT_FOUND') {
        console.log('ℹ️ New user - profile not found, starting onboarding flow');
      } else {
        console.log('⚠️ Could not fetch user profile:', error);
      }
      setOnboardingCompleted(false);
    }
  }, []);

  useEffect(() => {
    console.log('🚀 AuthProvider useEffect - setting up auth listeners');
    
    let isMounted = true;
    
    // Get initial session
    authService.getSession().then(async ({ session }) => {
      if (!isMounted) return;
      console.log('📱 Initial session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check onboarding status if user is authenticated
      if (session?.user?.id) {
        await checkOnboardingStatus(session.user.id);
      } else {
        setOnboardingCompleted(false);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        console.log('🔔 Auth state change event:', event, 'session:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          console.log('🔔 User signed out - root layout will handle navigation');
          setOnboardingCompleted(false);
        } else if (session?.user?.id) {
          // Check onboarding status when user signs in
          await checkOnboardingStatus(session.user.id);
        } else {
          setOnboardingCompleted(false);
        }
        setLoading(false);
        console.log('🔔 State updated after auth change');
      }
    );
    return () => {
      console.log('🧹 AuthProvider cleanup - unsubscribing');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    console.log('🚪 SignOut called - current session:', session?.user?.id);
    
    // Check if this is a dev mode session
    if (session?.user?.id === 'dev-user-id') {
      console.log('🚪 Dev mode sign out - clearing state manually');
      setSession(null);
      setUser(null);
      console.log('🚪 Dev mode: State cleared - root layout will handle navigation');
    } else {
      // Regular Supabase sign out
      await authService.signOut();
    }
    console.log('🚪 SignOut completed');
  }, [session]);

  const setDevModeAuth = useCallback(() => {
    console.log('🔧 Setting development mode authentication');
    // Create a mock session for development
    const mockSession = {
      access_token: 'dev-token',
      refresh_token: 'dev-refresh',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
      user: {
        id: 'dev-user-id',
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
    
    setSession(mockSession);
    setUser(mockSession.user);
    // For dev mode, start with onboarding not completed so developer sees the full flow
    setOnboardingCompleted(false);
    setLoading(false);
  }, []);

  const markOnboardingCompleted = useCallback(() => {
    console.log('✅ Marking onboarding as completed');
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