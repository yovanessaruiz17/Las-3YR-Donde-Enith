import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const FloatingWhatsApp: React.FC = () => {
  const { settings } = useStore();
  const cleanNumber = (settings.whatsapp || '+573244456597').replace(/[^0-9]/g, '');

  const handleClick = () => {
    const text = encodeURIComponent(
      settings.whatsapp_custom_message ||
        '¡Hola! Estoy visitando la tienda online de Las 3YR - Donde Enith y me gustaría recibir asesoría.'
    );
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 left-6 z-40 bg-[#25D366] hover:bg-[#20BA5A] text-white p-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-2 group cursor-pointer"
    >
      <MessageCircle className="w-6 h-6 fill-white text-[#25D366]" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold tracking-wider pr-1">
        ¿Necesitas ayuda?
      </span>
    </button>
  );
};
