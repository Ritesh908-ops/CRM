import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CRMUser, UserRole } from '../types/crm';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: CRMUser | null;
  isAuthenticated: boolean;
  role: UserRole;
  login: (email?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isSupabaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Built-in account for running the CRM without a Supabase project. It is a
 * local-only convenience — configure Supabase for any real deployment.
 */
export const DEMO_EMAIL = 'admin@khataview.com';
export const DEMO_PASSWORD = 'admin123';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CRMUser | null>(() => {
    const saved = localStorage.getItem('crm_auth_session');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved) as CRMUser;
      // Ignore anything that is not a session shape we recognise.
      return parsed && typeof parsed.email === 'string' && typeof parsed.id === 'string'
        ? parsed
        : null;
    } catch {
      localStorage.removeItem('crm_auth_session');
      return null;
    }
  });

  // Check Supabase auth session if configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const authUser: CRMUser = {
            id: session.user.id,
            email: session.user.email || 'admin@khataview.com',
            name: session.user.user_metadata?.name || 'Supabase Admin',
            role: 'Admin'
          };
          setUser(authUser);
          localStorage.setItem('crm_auth_session', JSON.stringify(authUser));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authUser: CRMUser = {
            id: session.user.id,
            email: session.user.email || 'admin@khataview.com',
            name: session.user.user_metadata?.name || 'Supabase Admin',
            role: 'Admin'
          };
          setUser(authUser);
          localStorage.setItem('crm_auth_session', JSON.stringify(authUser));
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = (authUser: CRMUser) => {
    setUser(authUser);
    localStorage.setItem('crm_auth_session', JSON.stringify(authUser));
  };

  const login = async (email?: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const inputEmail = email?.trim().toLowerCase() || '';
    const inputPassword = password ?? '';

    if (!inputEmail || !inputPassword) {
      return { success: false, error: 'Enter both an email address and a password.' };
    }

    // Always allow the local demo account to sign in, even if Supabase is configured.
    if (inputEmail === DEMO_EMAIL && inputPassword === DEMO_PASSWORD) {
      signIn({
        id: 'admin-local',
        email: DEMO_EMAIL,
        name: 'Khataview Admin',
        role: 'Admin'
      });
      return { success: true };
    }

    // Supabase is the source of truth whenever it is configured.
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: inputEmail,
          password: inputPassword
        });

        if (error) {
          return { success: false, error: error.message || 'Invalid email or password.' };
        }
        if (!data.user) {
          return { success: false, error: 'Sign-in did not return a user. Please try again.' };
        }

        signIn({
          id: data.user.id,
          email: data.user.email || inputEmail,
          name: data.user.user_metadata?.name || 'Supabase Admin',
          role: 'Admin'
        });
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Could not reach the authentication service.'
        };
      }
    }

    return {
      success: false,
      error: 'Invalid credentials. Supabase is not configured, so only the local demo admin account can sign in.'
    };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('crm_auth_session');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      role: user?.role || 'Admin',
      login,
      logout,
      isSupabaseActive: isSupabaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
