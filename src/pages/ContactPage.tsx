import React, { useState } from 'react';
import { MessageCircle, Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { storeService } from '../services/storeService';

export const ContactPage: React.FC = () => {
  const { settings, showToast } = useStore();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setLoading(true);
    const success = await storeService.sendContactMessage(formData);
    setLoading(false);

    if (success) {
      setSent(true);
      showToast('Mensaje enviado con éxito. Te responderemos pronto.', 'success');
      setFormData({ name: '', email: '', phone: '', message: '' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D83173] block mb-2">
            Estamos para asesorarte
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#163E2B] mb-3">
            Contacto y Atención al Cliente
          </h1>
          <p className="text-xs sm:text-sm text-[#546A5B]">
            ¿Tienes dudas sobre un producto, marcas de catálogo o deseas realizar un pedido personalizado? Escríbenos directamente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-6">
              <h2 className="font-serif text-xl font-bold text-[#163E2B]">
                Información de la Tienda
              </h2>

              <div className="space-y-4 text-xs sm:text-sm text-stone-600">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#E9F3EC] text-[#163E2B] flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#163E2B]">WhatsApp Oficial</h3>
                    <p>{settings.phone || '+57 324 445 6597'}</p>
                    <a
                      href={`https://wa.me/${(settings.whatsapp || '+573244456597').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#25D366] hover:underline block mt-0.5"
                    >
                      Abrir chat de WhatsApp →
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FDF2F6] text-[#D83173] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#163E2B]">Correo Electrónico</h3>
                    <p>{settings.email || 'info@las3yr.com'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] text-[#163E2B] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#163E2B]">Ubicación y Despachos</h3>
                    <p>{settings.address || 'Cartagena de Indias'}</p>
                    <p className="font-semibold text-[#D83173]">{settings.city || 'Cartagena'}, Bolívar, Colombia</p>
                    <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                      Ventas y entregas exclusivas en Cartagena mediante DiDi / inDrive. No contamos con envíos nacionales ni internacionales.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] text-[#163E2B] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#163E2B]">Horario de Atención</h3>
                    <p>{settings.schedule || 'Lunes a Sábado: 8:00 AM - 7:00 PM'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EFE9E1] shadow-md">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#163E2B] mb-2">
                Envíanos un Mensaje
              </h2>
              <p className="text-xs text-stone-500 mb-6">
                Te responderemos a la brevedad posible a través de correo o WhatsApp.
              </p>

              {sent ? (
                <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#EFE9E1] space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-[#163E2B] mx-auto" />
                  <h3 className="font-serif text-lg font-bold text-[#163E2B]">
                    ¡Mensaje Recibido!
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Muchas gracias por contactarnos. Nuestro equipo revisará tu mensaje y se comunicará contigo lo más pronto posible.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="px-6 py-2 rounded-full bg-[#163E2B] text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#163E2B] mb-1">
                        Tu Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej. Sandra Pérez"
                        className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#163E2B] mb-1">
                        Tu Correo *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">
                      Teléfono o WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ej. +57 300 123 4567"
                      className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">
                      Mensaje o Consulta *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Escribe aquí tu consulta sobre productos, pedidos o asesoría..."
                      className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-[#D83173] hover:bg-[#C52B66] text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
