import React, { createContext, useEffect, useState, useCallback } from 'react';
import { AuthContextType, AuthProviderProps, Session } from '../types';
import { authService } from '../services/authService';

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  setDevModeAuth: () => {},
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔄 AuthProvider render - session:', session?.user?.id, 'loading:', loading);

  useEffect(() => {
    console.log('🚀 AuthProvider useEffect - setting up auth listeners');
    
    let isMounted = true;
    
    // Get initial session
    authService.getSession().then(({ session }) => {
      if (!isMounted) return;
      console.log('📱 Initial session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        console.log('🔔 Auth state change event:', event, 'session:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          console.log('🔔 User signed out - root layout will handle navigation');
        }
        
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
    setLoading(false);
  }, []);

  const value = {
    session,
    user,
    loading,
    signOut,
    setDevModeAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 