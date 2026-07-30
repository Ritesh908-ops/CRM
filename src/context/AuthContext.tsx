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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CRMUser | null>(() => {
    const saved = localStorage.getItem('crm_auth_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  // Check Supabase auth session if configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const authUser: CRMUser = {
            id: session.user.id,
            email: session.user.email || 'admin@khatabook.com',
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
            email: session.user.email || 'admin@khatabook.com',
            name: session.user.user_metadata?.name || 'Supabase Admin',
            role: 'Admin'
          };
          setUser(authUser);
          localStorage.setItem('crm_auth_session', JSON.stringify(authUser));
        } else {
          setUser(null);
          localStorage.removeItem('crm_auth_session');
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email?: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    // If Supabase is configured, try Supabase auth
    if (isSupabaseConfigured && supabase && email && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.user) {
          const authUser: CRMUser = {
            id: data.user.id,
            email: data.user.email || email,
            name: 'Supabase Admin',
            role: 'Admin'
          };
          setUser(authUser);
          localStorage.setItem('crm_auth_session', JSON.stringify(authUser));
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Supabase Auth failed' };
      }
    }

    // Demo Admin Login (Local Fallback)
    const loginEmail = email || 'admin@khatabook.com';
    const demoAdmin: CRMUser = {
      id: `admin-${Date.now()}`,
      email: loginEmail,
      name: loginEmail.split('@')[0].toUpperCase() + ' (Admin)',
      role: 'Admin'
    };

    setUser(demoAdmin);
    localStorage.setItem('crm_auth_session', JSON.stringify(demoAdmin));
    return { success: true };
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
