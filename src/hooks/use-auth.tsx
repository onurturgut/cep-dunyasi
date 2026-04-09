import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '@/integrations/mongo/client';
import { hasAdminAccess } from '@/lib/admin';
import type { AuthSession, AuthSignUpResult, AuthUser } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, referralCode?: string | null) => Promise<{ data: AuthSignUpResult; error: any }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  verifyEmail: (email: string, code: string) => Promise<{ data: any; error: any }>;
  resendVerification: (email: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
} 

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncAdminState = (authUser: AuthUser | null) => {
    setIsAdmin(
      Boolean(authUser && hasAdminAccess(authUser.roles ?? [], authUser.permissions ?? [], authUser.is_active !== false)),
    );
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession);
      setUser(authSession?.user ?? null);
      syncAdminState(authSession?.user ?? null);

      setLoading(false);
    });

    db.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      syncAdminState(existingSession?.user ?? null);

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, referralCode?: string | null) => {
    return db.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, referral_code: referralCode ?? undefined },
      },
    });
  };

  const signIn = async (email: string, password: string, rememberMe = true) => {
    const { error } = await db.auth.signInWithPassword({ email, password, rememberMe });
    return { error };
  };

  const verifyEmail = async (email: string, code: string) => {
    return db.auth.verifyEmail({ email, code });
  };

  const resendVerification = async (email: string) => {
    return db.auth.resendVerification({ email });
  };

  const signOut = async () => {
    await db.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return <AuthContext.Provider value={{ user, session, isAdmin, loading, signUp, signIn, verifyEmail, resendVerification, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
