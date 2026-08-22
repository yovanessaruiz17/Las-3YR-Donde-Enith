import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  KeyRound,
  Smartphone,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  X,
  Lock,
  Eye,
  EyeOff,
  Database,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { totpService } from '../../services/totpService';
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
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Live rolling preview for setup helper
  const [liveCode, setLiveCode] = useState('------');
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  useEffect(() => {
    const updateTicker = async () => {
      try {
        const code = await totpService.getCurrentCode();
        setLiveCode(code);
        setSecondsRemaining(totpService.getSecondsRemaining());
      } catch (e) {
        console.error('Error generating live TOTP:', e);
      }
    };

    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleCopySecret = () => {
    const secret = totpService.getSecret();
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    showToast('Clave secreta copiada al portapapeles', 'success');
    setTimeout(() => setCopiedSecret(false), 3000);
  };

  const activeSecret = totpService.getSecret();
  const otpAuthUri = totpService.getOtpAuthUri(email || 'admin@las3yr.com');

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
              <span>Autenticación + Rol BD + 2FA</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#163E2B]">
              Acceso Administrativo
            </h1>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
              Área protegida para la administración de Las 3YR. Requiere correo, contraseña registrada en la base de datos y código temporal Authenticator.
            </p>
          </div>

          {/* Database connection badge */}
          <div className="flex items-center justify-center gap-2 text-[11px] bg-[#FAF8F5] py-1.5 px-3 rounded-full border border-stone-200 text-stone-600">
            <Database className="w-3.5 h-3.5 text-[#163E2B]" />
            <span>
              Verificación de Rol:{' '}
              <strong className="text-[#163E2B]">
                {isSupabaseConfigured ? 'Base de Datos Supabase (role = admin)' : 'Base de Datos Cifrada'}
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
                  placeholder="ej: enith@las3yr.com"
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
                  Código 2FA de Authenticator (6 dígitos)
                </label>
                <span className="text-[10px] text-[#25D366] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-ping" />
                  Dinámico (30s)
                </span>
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
                Generado por tu app Google Authenticator o Microsoft Authenticator.
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
                  <span>Validando rol y credenciales en BD...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verificar y Entrar al Panel</span>
                </>
              )}
            </button>

            {/* Quick helper note for owner */}
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
              <p className="font-bold text-[#163E2B] flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#D83173]" />
                <span>¿No tenías contraseña guardada en Supabase?</span>
              </p>
              <p className="text-[10px] text-stone-500 leading-relaxed">
                Ingresa tu correo (<strong>yorle170203@gmail.com</strong>), escribe la contraseña que quieras usar y el <strong>código de 6 dígitos de tu app Authenticator</strong> (o el de prueba). El sistema validará tu identidad como propietaria y te dará acceso inmediato.
              </p>
            </div>
          </form>

          {/* Setup / QR Code helper button */}
          <div className="pt-2 border-t border-[#F0EAE1] space-y-2.5">
            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F0EAE1] text-[#163E2B] text-xs font-semibold flex items-center justify-center gap-2 border border-[#E4DDD3] transition cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-[#D83173]" />
              <span>¿Primera vez? Vincular Authenticator con QR</span>
            </button>

            <div className="pt-1">
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

      {/* Authenticator Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EBE1D5] space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EAF2ED] text-[#163E2B] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#163E2B]">
                    Vincular App Authenticator
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Google Authenticator • Microsoft Authenticator • Authy
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSetupModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step by Step Instructions */}
            <div className="space-y-4 text-xs text-stone-600">
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#F0EAE1] space-y-2">
                <p className="font-bold text-[#163E2B]">Paso 1: Descarga la aplicación</p>
                <p className="text-[11px] text-stone-500">
                  Si aún no la tienes, descarga gratis <strong>Google Authenticator</strong> o{' '}
                  <strong>Microsoft Authenticator</strong> desde la App Store (iPhone) o Google Play Store (Android).
                </p>
              </div>

              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#F0EAE1] flex flex-col sm:flex-row items-center gap-5">
                {/* QR Code Container */}
                <div className="p-3 bg-white rounded-xl shadow-xs border border-stone-200 shrink-0">
                  <QRCodeSVG
                    value={otpAuthUri}
                    size={135}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-2 text-left">
                  <p className="font-bold text-[#163E2B]">Paso 2: Escanea el Código QR</p>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Abre la app en tu celular, toca <strong>Agregar cuenta (+)</strong> y apunta la cámara a este código QR.
                  </p>

                  <div className="pt-1">
                    <p className="text-[10px] text-stone-400 mb-1">¿No puedes escanear? Clave manual:</p>
                    <div className="flex items-center gap-1.5">
                      <code className="text-[10px] font-mono font-bold bg-white px-2 py-1 rounded-lg border border-stone-200 text-[#163E2B] select-all truncate max-w-[150px]">
                        {activeSecret}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="p-1 text-stone-500 hover:text-[#163E2B] hover:bg-white rounded-md border border-stone-200 transition text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSecret ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSecret ? 'Copiada' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Test */}
              <div className="bg-[#FAF6F0] border border-[#EBE1D5] p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#163E2B]">Código actual de prueba:</p>
                  <p className="text-[10px] text-stone-500">
                    Tu app debe mostrar exactamente este mismo código:
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-lg text-[#D83173] tracking-widest block">
                    {liveCode}
                  </span>
                  <span className="text-[9px] text-stone-400">
                    Expira en {secondsRemaining}s
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSetupModal(false);
                  showToast('¡Listo! Ya puedes ingresar con tus credenciales y el código de Authenticator.', 'info');
                }}
                className="w-full py-3 rounded-2xl bg-[#163E2B] hover:bg-[#0F2B1E] text-white font-bold text-xs tracking-wider uppercase transition shadow-md cursor-pointer"
              >
                Entendido, proceder al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
