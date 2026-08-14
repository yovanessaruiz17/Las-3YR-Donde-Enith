import React from 'react';
import { Search, ShoppingCart, ClipboardCheck, CreditCard, ChevronRight } from 'lucide-react';

const STEPS = [
  {
    num: '1',
    icon: Search,
    title: '1. Explora',
    desc: 'Descubre productos por categoría, marca o búsqueda.',
  },
  {
    num: '2',
    icon: ShoppingCart,
    title: '2. Selecciona',
    desc: 'Agrega tus productos favoritos al carrito de compras.',
  },
  {
    num: '3',
    icon: ClipboardCheck,
    title: '3. Revisa',
    desc: 'Verifica tu pedido, cantidad y total de compra.',
  },
  {
    num: '4',
    icon: CreditCard,
    title: '4. Recibe en Cartagena',
    desc: 'Completa tu pedido y recíbelo en tu puerta mediante DiDi o inDrive.',
  },
];

export const ShoppingExperience: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 bg-white border-b border-[#F0EAE1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-center font-bold text-xs sm:text-sm uppercase tracking-[0.2em] text-[#163E2B] mb-10">
          EXPERIENCIA DE COMPRA
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFE9E1] relative group hover:border-[#D83173]/30 transition">
                <div className="w-12 h-12 rounded-2xl bg-white text-[#D83173] flex items-center justify-center shrink-0 shadow-xs border border-[#F0EAE1] group-hover:bg-[#D83173] group-hover:text-white transition-colors duration-200">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[#163E2B] mb-1">{step.title}</h4>
                  <p className="text-xs text-[#64786A] leading-relaxed">{step.desc}</p>
                </div>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5 z-10" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
