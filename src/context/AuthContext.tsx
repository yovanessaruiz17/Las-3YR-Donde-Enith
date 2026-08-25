import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole } from '../types';
import { adminAuthService } from '../services/adminAuthService';

export const ADMIN_SESSION_DURATION_DAYS = 15;
export const ADMIN_SESSION_DURATION_MS = 15 * 24 * 60 * 60 * 1000; // 15 days in ms
export const ADMIN_SESSION_KEY = 'las3yr_admin_session_v1';

export interface AdminSessionInfo {
  email: string;
  loginTimestamp: number;
  expiresAt: number;
  verifiedWith2FA: boolean;
}

export function getAdminSessionInfo(): AdminSessionInfo | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAdminSession(email: string): AdminSessionInfo {
  const now = Date.now();
  const session: AdminSessionInfo = {
    email,
    loginTimestamp: now,
    expiresAt: now + ADMIN_SESSION_DURATION_MS,
    verifiedWith2FA: true,
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function isSessionExpired(session: AdminSessionInfo | null): boolean {
  if (!session || !session.expiresAt) return true;
  return Date.now() > session.expiresAt;
}

export function calculateDaysRemaining(session: AdminSessionInfo | null): number {
  if (!session || !session.expiresAt) return 0;
  const diff = session.expiresAt - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  adminSession: AdminSessionInfo | null;
  sessionDaysRemaining: number;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, pass: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loginAdminWithCredentials: (email: string, pass: string, totpCode: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEMO_USER_KEY = 'las3yr_session_user_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminSession, setAdminSessionState] = useState<AdminSessionInfo | null>(() => {
    return getAdminSessionInfo();
  });

  const [user, setUser] = useState<Profile | null>(() => {
    try {
      const saved = localStorage.getItem(DEMO_USER_KEY);
      if (!saved) return null;
      const parsed: Profile = JSON.parse(saved);

      // If user is admin, enforce the 15-day session limit
      if (parsed.role === 'admin') {
        const session = getAdminSessionInfo();
        if (!session) {
          // If session wasn't tracked yet, initialize 15-day session from now
          const newSession = saveAdminSession(parsed.email);
          setAdminSessionState(newSession);
          return parsed;
        }
        if (isSessionExpired(session)) {
          // 15 days have passed! Expire admin session
          localStorage.removeItem(DEMO_USER_KEY);
          localStorage.removeItem(ADMIN_SESSION_KEY);
          return null;
        }
      }

      return parsed;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Periodic check to auto-expire session when 15 days elapse
  useEffect(() => {
    const checkExpiry = () => {
      if (user?.role === 'admin') {
        const session = getAdminSessionInfo();
        if (session && isSessionExpired(session)) {
          console.info('La sesión de administrador de 15 días ha expirado.');
          setUser(null);
          setAdminSessionState(null);
          localStorage.removeItem(DEMO_USER_KEY);
          localStorage.removeItem(ADMIN_SESSION_KEY);
          if (isSupabaseConfigured && supabase) {
            supabase.auth.signOut().catch(() => {});
          }
        }
      }
    };

    checkExpiry();
    // Check every hour or when tab becomes visible
    const interval = setInterval(checkExpiry, 60 * 60 * 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkExpiry();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user]);

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
          // Only clear if not in a valid local admin session
          const currentAdmin = getAdminSessionInfo();
          if (!currentAdmin || isSessionExpired(currentAdmin)) {
            setUser(null);
            setAdminSessionState(null);
            localStorage.removeItem(DEMO_USER_KEY);
            localStorage.removeItem(ADMIN_SESSION_KEY);
          }
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
        const isUserAdmin = data.role === 'admin';
        if (isUserAdmin) {
          const session = getAdminSessionInfo();
          if (session && isSessionExpired(session)) {
            // Expired 15-day session
            await supabase.auth.signOut();
            setUser(null);
            setAdminSessionState(null);
            localStorage.removeItem(DEMO_USER_KEY);
            localStorage.removeItem(ADMIN_SESSION_KEY);
            setLoading(false);
            return;
          }
          if (!session) {
            const newSession = saveAdminSession(data.email || email);
            setAdminSessionState(newSession);
          }
        }

        const profile: Profile = {
          id: data.id,
          email: data.email || email,
          full_name: data.full_name || email.split('@')[0],
          phone: data.phone,
          role: data.role === 'admin' ? 'admin' : 'customer',
          created_at: data.created_at || new Date().toISOString(),
        };
        setUser(profile);
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
      } else {
        const profile: Profile = {
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: 'customer',
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
    const cleanEmail = email.trim();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email not confirmed') || msg.includes('email not verified')) {
          return {
            error: new Error(
              'Tu correo aún no ha sido confirmado. (Nota: Para permitir el acceso inmediato a todos los compradores sin confirmar correo, desactiva la opción "Confirm email" en tu panel de Supabase: Authentication > Providers > Email).'
            ),
          };
        }
        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          return { error: new Error('Correo o contraseña incorrectos. Por favor verifica tus credenciales.') };
        }
        return { error: new Error(error.message) };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id, data.user.email || cleanEmail);
      }
      return { error: null };
    }

    if (pass.length < 4) {
      return { error: new Error('La contraseña debe tener al menos 4 caracteres.') };
    }

    const profile: Profile = {
      id: 'usr-' + Date.now(),
      email: cleanEmail,
      full_name: cleanEmail.split('@')[0],
      role: 'customer',
      created_at: new Date().toISOString(),
    };
    setUser(profile);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
    return { error: null };
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string) => {
    const cleanEmail = email.trim();
    const cleanName = fullName.trim();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: cleanName,
            role: 'customer',
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data.user) {
        // Upsert profile into public.profiles
        try {
          await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              full_name: cleanName || cleanEmail.split('@')[0],
              role: 'customer',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch (e) {
          console.warn('Profile upsert note:', e);
        }

        if (data.session) {
          await fetchUserProfile(data.user.id, data.user.email || cleanEmail);
        }
      }

      return { error: null };
    }

    const profile: Profile = {
      id: 'usr-' + Date.now(),
      email: cleanEmail,
      full_name: cleanName,
      role: 'customer',
      created_at: new Date().toISOString(),
    };
    setUser(profile);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
    return { error: null };
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signout note:', e);
      }
    }
    setUser(null);
    setAdminSessionState(null);
    localStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  };

  const loginAdminWithCredentials = async (
    email: string,
    pass: string,
    totpCode: string
  ): Promise<{ error: Error | null }> => {
    const { profile, error } = await adminAuthService.loginAdmin(email, pass, totpCode);
    if (error || !profile) {
      return { error: error || new Error('No se pudo verificar la cuenta de administrador.') };
    }

    // Set user profile & establish 15-day maximum session
    setUser(profile);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
    const newSession = saveAdminSession(profile.email);
    setAdminSessionState(newSession);

    return { error: null };
  };

  const role: UserRole = user?.role === 'admin' ? 'admin' : 'customer';
  const isAdmin = role === 'admin';
  const sessionDaysRemaining = calculateDaysRemaining(adminSession);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        loading,
        adminSession,
        sessionDaysRemaining,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        loginAdminWithCredentials,
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

