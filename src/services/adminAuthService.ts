/**
 * Service for Admin Authentication & Role Verification
 * Uses Supabase Database (profiles table) when available, or Web Crypto SHA-256 hashed storage.
 * NO credentials or emails are hardcoded in the codebase.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';
import { totpService } from './totpService';

const LOCAL_ADMIN_USERS_KEY = 'las3yr_local_admin_db_v2';

export interface LocalAdminAccount {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  salt: string;
  role: 'admin';
  createdAt: string;
}

// Helper: Hash password using SHA-256 with salt via Web Crypto API
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Generate random salt
export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => ('0' + byte.toString(16)).slice(-2)).join('');
}

export const adminAuthService = {
  /**
   * Get all registered local admin accounts
   */
  getLocalAdmins(): LocalAdminAccount[] {
    try {
      const raw = localStorage.getItem(LOCAL_ADMIN_USERS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  /**
   * Check if there is at least one admin registered
   */
  hasAdminAccounts(): boolean {
    return this.getLocalAdmins().length > 0;
  },

  /**
   * Register or initialize an admin user with encrypted password in local database
   */
  async registerLocalAdmin(
    email: string,
    pass: string,
    fullName: string = 'Administrador'
  ): Promise<{ success: boolean; error: string | null }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Correo electrónico inválido.' };
    }
    if (pass.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const admins = this.getLocalAdmins();
    const existingIndex = admins.findIndex((a) => a.email.toLowerCase() === cleanEmail);

    const salt = generateSalt();
    const passwordHash = await hashPasswordWithSalt(pass, salt);

    const newAdmin: LocalAdminAccount = {
      id: 'admin-' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      fullName: fullName.trim() || 'Administrador',
      passwordHash,
      salt,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      admins[existingIndex] = newAdmin;
    } else {
      admins.push(newAdmin);
    }

    localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(admins));
    return { success: true, error: null };
  },

  /**
   * Authenticate admin using:
   * 1. Email & Password
   * 2. 2FA Code (Authenticator)
   * 3. Role verification (role === 'admin')
   */
  async loginAdmin(
    email: string,
    pass: string,
    totpCode: string
  ): Promise<{ profile: Profile | null; error: Error | null }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { profile: null, error: new Error('Ingresa un correo electrónico válido.') };
    }
    if (!pass || pass.length < 4) {
      return { profile: null, error: new Error('Ingresa la contraseña de administrador.') };
    }

    // 1. Verify 2FA Code
    const isValidTotp = await totpService.verifyCode(totpCode);
    if (!isValidTotp) {
      return {
        profile: null,
        error: new Error('Código 2FA de Authenticator inválido o expirado. Verifica la hora de tu celular e inténtalo de nuevo.')
      };
    }

    // 2. Supabase DB Authentication
    if (isSupabaseConfigured && supabase) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (authError || !authData.user) {
        return {
          profile: null,
          error: new Error(authError?.message || 'Credenciales de acceso incorrectas en la base de datos.')
        };
      }

      // Query profiles table for role === 'admin'
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        return {
          profile: null,
          error: new Error('No se encontró el perfil de usuario en la base de datos.')
        };
      }

      if (profileData.role !== 'admin') {
        // Sign out since user does not have admin permissions
        await supabase.auth.signOut();
        return {
          profile: null,
          error: new Error(
            `Acceso denegado: El usuario ${cleanEmail} tiene rol "${profileData.role}", no es Administrador. Asigna role = 'admin' en la tabla profiles de Supabase.`
          )
        };
      }

      const adminProfile: Profile = {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name || 'Administrador',
        phone: profileData.phone,
        role: 'admin',
        created_at: profileData.created_at || new Date().toISOString(),
      };

      return { profile: adminProfile, error: null };
    }

    // 3. Local Database Authentication (with SHA-256 salted hashes)
    const admins = this.getLocalAdmins();

    // If no admin accounts exist yet, allow initial creation
    if (admins.length === 0) {
      const reg = await this.registerLocalAdmin(cleanEmail, pass, 'Administrador');
      if (!reg.success) {
        return { profile: null, error: new Error(reg.error || 'Error creando cuenta de administrador') };
      }
      const adminProfile: Profile = {
        id: 'admin-' + Date.now(),
        email: cleanEmail,
        full_name: 'Administradora Las 3YR',
        role: 'admin',
        created_at: new Date().toISOString(),
      };
      return { profile: adminProfile, error: null };
    }

    const matchedAdmin = admins.find((a) => a.email.toLowerCase() === cleanEmail);
    if (!matchedAdmin) {
      return {
        profile: null,
        error: new Error('No existe una cuenta de administrador registrada con este correo en la base de datos.')
      };
    }

    const computedHash = await hashPasswordWithSalt(pass, matchedAdmin.salt);
    if (computedHash !== matchedAdmin.passwordHash) {
      return {
        profile: null,
        error: new Error('Contraseña de administrador incorrecta.')
      };
    }

    const adminProfile: Profile = {
      id: matchedAdmin.id,
      email: matchedAdmin.email,
      full_name: matchedAdmin.fullName,
      role: 'admin',
      created_at: matchedAdmin.createdAt,
    };

    return { profile: adminProfile, error: null };
  }
};
