import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const Hero: React.FC = () => {
  const { banners = [] } = useStore();
  const activeBanner = (banners || []).find((b) => b.active) || {
    title: 'Belleza, hogar y estilo que te acompañan cada día',
    description: 'Descubre productos de las mejores marcas de catálogo seleccionados para ti.',
    tag: 'Las mejores marcas de catálogo.',
    button_text: 'EXPLORAR PRODUCTOS',
    button_url: '/productos',
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#FAF6F0] via-[#FCF8F5] to-[#FDF2F5] border-b border-[#F0EAE1]">
      {/* Decorative floral gradient overlay */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Content matching screenshot */}
          <div className="lg:col-span-6 space-y-5 text-center lg:text-left z-10">
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FCE7F0] text-[#C52B66] text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeBanner.tag || 'Las mejores marcas de catálogo'}</span>
            </div>

            {/* Display Headline matching screenshot */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#163E2B] leading-[1.15] tracking-tight">
              Belleza, hogar y estilo que te acompañan{' '}
              <span className="text-[#D83173] font-serif italic block sm:inline">
                cada día
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#4E6154] max-w-lg mx-auto lg:mx-0 leading-relaxed">
              {activeBanner.description ||
                'Descubre productos de las mejores marcas de catálogo seleccionados para ti.'}
            </p>

            {/* Action CTA matching screenshot */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to={activeBanner.button_url || '/productos'}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#D83173] hover:bg-[#C52B66] text-white text-xs sm:text-sm font-bold tracking-widest uppercase shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-center flex items-center justify-center gap-2 group"
              >
                <span>{activeBanner.button_text || 'EXPLORAR PRODUCTOS'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/ofertas"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-[#FAF6F1] text-[#163E2B] border border-[#E2D8CD] text-xs sm:text-sm font-semibold tracking-wider uppercase transition text-center"
              >
                Ver Ofertas
              </Link>
            </div>
          </div>

          {/* Right Product Composition Image matching screenshot */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Soft pink glow shape */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#FCE7F0]/60 to-[#E8F3EB]/60 rounded-3xl blur-2xl -z-10" />

              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white/40 backdrop-blur-xs aspect-4/3 sm:aspect-16/10 flex items-center justify-center p-4 sm:p-6">
                <img
                  src={activeBanner.image_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80'}
                  alt="Catálogo Las 3YR"
                  className="w-full h-full object-cover rounded-2xl shadow-inner"
                />

                {/* Floating Brand Badge */}
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-[#F0EAE1] flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D83173] animate-pulse"></div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#8D9B91] tracking-wider">Cartagena de Indias</p>
                    <p className="text-xs font-bold text-[#163E2B]">Envíos por DiDi / inDrive</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <span className="w-6 h-2 rounded-full bg-[#D83173]"></span>
          <span className="w-2 h-2 rounded-full bg-[#163E2B]/20"></span>
          <span className="w-2 h-2 rounded-full bg-[#163E2B]/20"></span>
        </div>
      </div>
    </section>
  );
};
