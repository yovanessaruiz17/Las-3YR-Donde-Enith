import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole } from '../types';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, pass: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loginAsDemoAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEMO_USER_KEY = 'las3yr_demo_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(() => {
    try {
      const saved = localStorage.getItem(DEMO_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchUserProfile(session.user.id, session.user.email || '');
        } else {
          setLoading(false);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          localStorage.removeItem(DEMO_USER_KEY);
          setLoading(false);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUser(data as Profile);
      } else {
        // Create basic profile or check if it's admin email
        const isAdminEmail = email.includes('admin') || email === 'enith@las3yr.com' || email === 'yorle170203@gmail.com';
        const profile: Profile = {
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: isAdminEmail ? 'admin' : 'customer',
          created_at: new Date().toISOString(),
        };
        setUser(profile);
      }
    } catch (e) {
      console.warn('Could not fetch user profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      return { error: error ? new Error(error.message) : null };
    }

    // Demo / fallback auth
    if (pass.length < 4) {
      return { error: new Error('La contraseña debe tener al menos 4 caracteres.') };
    }

    const isAdmin = email.toLowerCase().includes('admin') || email.toLowerCase().includes('enith') || email === 'yorle170203@gmail.com';
    const profile: Profile = {
      id: 'usr-' + Date.now(),
      email,
      full_name: email.includes('enith') ? 'Enith (Propietaria)' : 'Administrador',
      role: isAdmin ? 'admin' : 'customer',
      created_at: new Date().toISOString(),
    };
    setUser(profile);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
    return { error: null };
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: fullName } },
      });
      return { error: error ? new Error(error.message) : null };
    }

    const profile: Profile = {
      id: 'usr-' + Date.now(),
      email,
      full_name: fullName,
      role: 'customer',
      created_at: new Date().toISOString(),
    };
    setUser(profile);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
    return { error: null };
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(DEMO_USER_KEY);
  };

  const loginAsDemoAdmin = () => {
    const adminUser: Profile = {
      id: 'admin-las3yr-demo',
      email: 'enith@las3yr.com',
      full_name: 'Enith — Propietaria Las 3YR',
      role: 'admin',
      created_at: new Date().toISOString(),
    };
    setUser(adminUser);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(adminUser));
  };

  const role = user?.role || 'customer';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        loginAsDemoAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};
