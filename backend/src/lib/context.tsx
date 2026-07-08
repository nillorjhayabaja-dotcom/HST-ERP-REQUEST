import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { signIn, signOut, getProfile, type AuthUser } from './auth.js';
import { queryClient } from './query-client.js';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const profile = await getProfile();
          setUser(profile);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn(email, password);
    setUser(result.user);
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
    queryClient.clear();
  };

  const refreshProfile = async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn: handleSignIn, signOut: handleSignOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}