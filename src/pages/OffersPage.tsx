import React, { useState, useEffect } from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { storeService } from '../services/storeService';
import { ProductCard } from '../components/product/ProductCard';

export const OffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeService.getProducts({ offersOnly: true }).then((data) => {
      setOffers(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFAF8] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-[#D83173] to-[#9F1D50] rounded-3xl p-8 sm:p-12 text-white mb-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <Flame className="w-4 h-4 text-amber-300" />
              <span>Descuentos Exclusivos de Temporada</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
              Ofertas Imperdibles
            </h1>
            <p className="text-xs sm:text-sm text-pink-100 leading-relaxed">
              Aprovecha precios especiales en productos seleccionados de catálogo con hasta un 50% de descuento. ¡Unidades limitadas!
            </p>
          </div>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 h-80 animate-pulse border border-[#EFE9E1]" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE9E1] max-w-md mx-auto">
            <Sparkles className="w-10 h-10 text-[#D83173] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#163E2B]">No hay ofertas activas en este momento</h3>
            <p className="text-xs text-stone-500 mt-1">Vuelve pronto para descubrir promociones exclusivas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {offers.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
