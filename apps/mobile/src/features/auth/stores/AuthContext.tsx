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
      const profile = await userService.getUserProfile();
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
    const initializeAuth = async () => {
      try {
        const { session } = await authService.getSession();
        if (!isMounted) return;
        console.log('📱 Initial session:', session?.user?.id);
        
        // Validate session if it exists
        if (session) {
          console.log('🔍 Validating session against database...');
          try {
            // Try to get the user to validate the session
            const { user, error } = await authService.getCurrentUser();
            if (error || !user) {
              console.log('⚠️ Session invalid - user not found in database:', error);
              // Clear invalid session
              await authService.signOut();
              setSession(null);
              setUser(null);
              setOnboardingCompleted(false);
              setLoading(false);
              return;
            }
            
            // Validate user exists in database by checking profile endpoint
            // This will return 401 if the user doesn't exist in auth.users
            console.log('🔍 Validating user exists in database...');
            try {
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/profile/debug`, {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                console.log('❌ User validation failed - status:', response.status);
                await authService.signOut();
                setSession(null);
                setUser(null);
                setOnboardingCompleted(false);
                setLoading(false);
                return;
              }
              
              const debugData = await response.json();
              console.log('🔍 User validation result:', debugData);
              
              if (!debugData.exists_in_auth_users) {
                console.log('❌ User does not exist in auth.users table - clearing session');
                await authService.signOut();
                setSession(null);
                setUser(null);
                setOnboardingCompleted(false);
                setLoading(false);
                return;
              }
            } catch (err) {
              console.log('❌ Failed to validate user:', err);
              await authService.signOut();
              setSession(null);
              setUser(null);
              setOnboardingCompleted(false);
              setLoading(false);
              return;
            }
            
            // Additional validation: Try to get profile to ensure user exists
            console.log('📋 Checking user profile...');
            let hasProfile = false;
            try {
              // This will fail if user doesn't exist in auth.users
              const profile = await userService.getUserProfile();
              console.log('✅ User profile found:', profile.username);
              hasProfile = true;
            } catch (err: any) {
              console.log('📋 Profile check error:', err.message);
              
              // If it's not just a missing profile, the user doesn't exist
              if (err.message !== 'PROFILE_NOT_FOUND') {
                console.log('❌ User does not exist in database - clearing session');
                await authService.signOut();
                setSession(null);
                setUser(null);
                setOnboardingCompleted(false);
                setLoading(false);
                return;
              }
              // PROFILE_NOT_FOUND is OK - user exists but hasn't created profile yet
              console.log('ℹ️ User exists but no profile yet - continuing with onboarding');
            }
            
            // If we get here, session is valid
            console.log('✅ Session validated successfully');
            setSession(session);
            setUser(session.user ?? null);
            
            // Only check onboarding after validation
            if (session.user?.id && hasProfile) {
              await checkOnboardingStatus(session.user.id);
            } else {
              setOnboardingCompleted(false);
            }
          } catch (error) {
            console.log('⚠️ Session validation failed:', error);
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
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setLoading(false);
      }
    };
    
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        console.log('🔔 Auth state change event:', event, 'session:', session?.user?.id);
        
        // For SIGNED_IN events during initial load, we should still process them
        // as they might be from a fresh login (like OTP verification)
        if (loading && event === 'SIGNED_IN') {
          console.log('🔔 Processing SIGNED_IN during initial load - likely from fresh login');
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          console.log('🔔 User signed out - root layout will handle navigation');
          setOnboardingCompleted(false);
        } else if (session?.user?.id && event === 'SIGNED_IN') {
          // Only check onboarding for new sign ins, not initial load
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
      setOnboardingCompleted(false);
    } else {
      await authService.signOut();
      setSession(null);
      setUser(null);
      setOnboardingCompleted(false);
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