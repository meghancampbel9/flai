import { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean;
  signOut: () => Promise<void>;
  setDevModeAuth: () => void;
  markOnboardingCompleted: () => void;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';

export { Session, User }; 