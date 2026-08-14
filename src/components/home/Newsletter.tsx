import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { useStore } from '../../context/StoreContext';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const res = await storeService.subscribeNewsletter(email);
    setLoading(false);

    if (res.success) {
      setSubscribed(true);
      showToast(res.message, 'success');
      setEmail('');
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-[#F4EEE7] relative overflow-hidden border-b border-[#EBE3D9]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left copy matching screenshot */}
          <div className="md:col-span-6 space-y-2 text-center md:text-left">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#163E2B]">
              ¿Lista para renovar tu estilo?
            </h3>
            <p className="text-xs sm:text-sm text-[#546A5B] leading-relaxed">
              Recibe novedades, lanzamientos y ofertas exclusivas directamente en tu correo.
            </p>
          </div>

          {/* Right Form matching screenshot */}
          <div className="md:col-span-6">
            {subscribed ? (
              <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-[#DCE8DF] flex items-center gap-3 text-[#163E2B]">
                <CheckCircle2 className="w-6 h-6 text-[#163E2B] shrink-0" />
                <p className="text-xs sm:text-sm font-semibold">
                  ¡Gracias por suscribirte! Revisa tu bandeja de entrada para sorpresas exclusivas.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ingresa tu correo electrónico"
                  className="flex-1 bg-white px-5 py-3 rounded-full text-xs sm:text-sm text-[#183B2B] outline-none border border-[#E0D7CB] focus:border-[#D83173] focus:ring-2 focus:ring-[#D83173]/10 transition shadow-2xs placeholder:text-[#9AA89E]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 rounded-full bg-[#D83173] hover:bg-[#C52B66] text-white text-xs font-bold tracking-widest uppercase shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <span>{loading ? 'ENVIANDO...' : 'SUSCRIBIRME'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
