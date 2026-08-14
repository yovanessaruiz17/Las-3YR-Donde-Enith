import React from 'react';
import { Award, Truck, MessageCircle, ShieldCheck, MapPin } from 'lucide-react';

const BENEFITS = [
  {
    icon: MapPin,
    title: 'Exclusivo en Cartagena',
    subtitle: 'Solo venta y entrega local',
  },
  {
    icon: Truck,
    title: 'Envíos por DiDi / inDrive',
    subtitle: 'Tarifa directa según la app',
  },
  {
    icon: Award,
    title: 'Productos 100% Originales',
    subtitle: 'Garantía oficial de catálogo',
  },
  {
    icon: ShieldCheck,
    title: 'Pagos Transparentes',
    subtitle: 'Nequi, Llave o Contraentrega',
  },
];

export const Benefits: React.FC = () => {
  return (
    <section className="py-8 bg-white border-b border-[#F0EAE1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {BENEFITS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center group p-3 rounded-2xl hover:bg-[#FAF8F5] transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-[#FAF6F0] group-hover:bg-[#FCE7F0] text-[#163E2B] group-hover:text-[#D83173] flex items-center justify-center mb-3 transition-colors duration-200 shadow-2xs">
                  <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#163E2B] leading-tight">
                  {item.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#64786A] mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
