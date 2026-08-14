import React, { useState, useEffect } from 'react';
import {
  Download,
  Share2,
  PlusSquare,
  X,
  Smartphone,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if dismissed recently (within 5 days)
    const dismissedTimestamp = localStorage.getItem('las3yr_pwa_dismissed');
    if (dismissedTimestamp) {
      const diffDays = (Date.now() - parseInt(dismissedTimestamp, 10)) / (1000 * 60 * 60 * 24);
      if (diffDays < 5) {
        setIsDismissed(true);
      }
    }

    // Capture beforeinstallprompt for Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback for browsers that don't trigger beforeinstallprompt directly
      alert('Para instalar en tu teléfono: abre el menú del navegador (⋮ o compartir) y presiona "Instalar aplicación" o "Agregar a la pantalla principal".');
      return;
    }

    // Trigger native prompt
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      setIsStandalone(true);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('las3yr_pwa_dismissed', Date.now().toString());
  };

  // If already installed, don't show the floating prompt
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Banner (visible if not dismissed and prompt available or on mobile) */}
      {!isDismissed && (deferredPrompt || isIOS) && (
        <div
          id="pwa-install-banner"
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 backdrop-blur-md border border-[#EFE9E1] rounded-2xl shadow-xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
        >
          <div className="flex items-start gap-3.5">
            {/* App Icon Preview */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#163E2B] to-[#0E281C] p-2 flex items-center justify-center shrink-0 shadow-md border border-[#F48FB1]/30">
              <span className="font-serif font-bold text-white text-xs tracking-tighter text-center leading-tight">
                3YR
              </span>
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5">
                <h4 className="font-serif font-bold text-sm text-[#163E2B] truncate">
                  Instalar App Las 3YR
                </h4>
                <Sparkles className="w-3.5 h-3.5 text-[#D83173] shrink-0" />
              </div>
              <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                Acceso directo desde tu teléfono, catálogo de belleza siempre a mano y pedidos en Cartagena.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={handleInstallClick}
                  className="px-3.5 py-1.5 rounded-lg bg-[#D83173] text-white text-xs font-bold hover:bg-[#C52B66] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar en Teléfono</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 rounded-lg text-stone-500 hover:text-stone-700 text-xs font-medium hover:bg-stone-100 transition"
                >
                  Ahora no
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Step-by-Step Installation Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 border border-[#EFE9E1] shadow-2xl relative animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#163E2B] flex items-center justify-center text-white font-serif font-bold text-sm shadow-md">
                  3YR
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#163E2B] text-base">
                    Instalar en iPhone / iPad
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Sigue estos 2 sencillos pasos en Safari:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-3.5 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D8] text-xs text-stone-700">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#D83173] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </div>
                <div className="leading-snug">
                  <span>En la barra inferior de <strong>Safari</strong>, toca el botón de <strong>Compartir</strong></span>
                  <div className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-stone-200 ml-1 font-semibold text-stone-900">
                    <Share2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Compartir</span>
                  </div>.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#D83173] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </div>
                <div className="leading-snug">
                  <span>Desliza hacia abajo en el menú y selecciona <strong>"Agregar a pantalla de inicio"</strong></span>
                  <div className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-stone-200 ml-1 font-semibold text-stone-900 mt-1">
                    <PlusSquare className="w-3.5 h-3.5 text-stone-700" />
                    <span>Agregar a pantalla de inicio</span>
                  </div>.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#163E2B] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </div>
                <div className="leading-snug">
                  Toca <strong>"Agregar"</strong> en la esquina superior derecha. ¡El ícono de Las 3YR aparecerá en tu teléfono como una App nativa!
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#163E2B] text-white text-xs font-bold hover:bg-[#123323] transition"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Reusable Install Button for Footer, Header or Mobile Drawer
export const InstallAppButton: React.FC<{
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  label?: string;
}> = ({
  className = '',
  variant = 'outline',
  label = 'Instalar App en el Celular',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>App Instalada</span>
      </div>
    );
  }

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsStandalone(true);
        setDeferredPrompt(null);
      }
    } else {
      alert('Para instalar la App: abre el menú de tu navegador (⋮ en Chrome o Compartir en Safari) y selecciona "Instalar aplicación" o "Agregar a la pantalla principal".');
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#D83173] text-white hover:bg-[#C52B66] shadow-xs';
      case 'ghost':
        return 'text-[#163E2B] hover:bg-[#FAF8F5]';
      case 'outline':
      default:
        return 'border border-[#D83173]/40 text-[#D83173] hover:bg-[#FDF2F6]';
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${getVariantStyles()} ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>

      {/* iOS Modal if clicked */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#EFE9E1] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-[#163E2B] text-base">
                Instalar en iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D8] text-xs text-stone-700 leading-relaxed">
              <p>1. Toca el botón <strong>Compartir</strong> (<Share2 className="inline w-3 h-3 text-blue-500" />) en la barra de Safari.</p>
              <p>2. Selecciona <strong>"Agregar a pantalla de inicio"</strong> (<PlusSquare className="inline w-3 h-3 text-stone-700" />).</p>
              <p>3. Pulsa <strong>"Agregar"</strong> y ¡listo!</p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#163E2B] text-white text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
