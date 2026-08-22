import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const Admin2FALogin: React.FC = () => {
  const { loginAdminWithCredentials } = useAuth();
  const { showToast } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('Por favor ingresa la contraseña de administrador.');
      return;
    }

    const cleanCode = totpCode.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('El código de seguridad debe tener exactamente 6 dígitos numéricos.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await loginAdminWithCredentials(email.trim(), password, cleanCode);
      if (error) {
        setErrorMessage(error.message);
        showToast(error.message, 'error');
      } else {
        showToast('¡Acceso autorizado! Bienvenido al panel de administración.', 'success');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al autenticar credenciales de administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 sm:py-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-xl text-center space-y-6">
          {/* Header Icon */}
          <div className="w-14 h-14 rounded-2xl bg-[#163E2B] text-[#A3E635] flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAF2ED] text-[#163E2B] rounded-full text-[11px] font-bold tracking-wider uppercase mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Acceso Administrativo Protegido</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#163E2B]">
              Panel de Administración
            </h1>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
              Área exclusiva para administradores autorizados de Las 3YR.
            </p>
          </div>

          {/* Database connection badge */}
          <div className="flex items-center justify-center gap-2 text-[11px] bg-[#FAF8F5] py-1.5 px-3 rounded-full border border-stone-200 text-stone-600">
            <Database className="w-3.5 h-3.5 text-[#163E2B]" />
            <span>
              Seguridad:{' '}
              <strong className="text-[#163E2B]">
                {isSupabaseConfigured ? 'Base de Datos Supabase (Rol Admin + 2FA)' : 'Cifrado Local + 2FA'}
              </strong>
            </span>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-left text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error de Acceso</p>
                <p className="text-[11px] opacity-90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#163E2B] mb-1">
                Correo Electrónico de Administrador
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="ej: tu_correo@gmail.com"
                  required
                  autoFocus
                  className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#163E2B] focus:bg-white rounded-xl text-sm py-2.5 pl-10 pr-3.5 outline-none transition"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#163E2B] mb-1">
                Contraseña de Administrador
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Introduce tu contraseña"
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#163E2B] focus:bg-white rounded-xl text-sm py-2.5 pl-10 pr-10 outline-none transition"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 2FA 6-digit PIN Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#163E2B]">
                  Código de Seguridad Authenticator (6 dígitos)
                </label>
              </div>

              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTotpCode(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="• • • • • •"
                  className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#163E2B] focus:bg-white rounded-xl text-center font-mono font-black text-xl tracking-[0.4em] py-3 px-4 outline-none transition"
                  required
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] text-stone-400 mt-1 text-center">
                Ingresa el código dinámico generado por tu aplicación Authenticator vinculada.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || totpCode.length !== 6 || !email || !password}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                totpCode.length === 6 && email && password && !loading
                  ? 'bg-[#163E2B] hover:bg-[#0F2B1E] text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verificar y Entrar al Panel</span>
                </>
              )}
            </button>
          </form>

          {/* Return link */}
          <div className="pt-3 border-t border-[#F0EAE1]">
            <Link
              to="/"
              className="inline-block text-xs font-medium text-stone-500 hover:text-[#163E2B] transition"
            >
              ← Volver a la Tienda Pública
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
