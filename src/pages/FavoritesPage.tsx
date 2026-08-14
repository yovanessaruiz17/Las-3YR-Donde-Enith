import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { storeService } from '../services/storeService';
import { useFavorites } from '../context/FavoritesContext';
import { ProductCard } from '../components/product/ProductCard';

export const FavoritesPage: React.FC = () => {
  const { favorites } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeService.getProducts({ activeOnly: false }).then((all) => {
      setFavoriteProducts(all.filter((p) => favorites.includes(p.id)));
      setLoading(false);
    });
  }, [favorites]);

  return (
    <div className="min-h-screen bg-[#FCFAF8] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#163E2B] mb-2 flex items-center gap-2">
            <span>Mis Favoritos</span>
            <Heart className="w-6 h-6 text-[#D83173] fill-[#D83173]" />
          </h1>
          <p className="text-xs sm:text-sm text-[#546A5B]">
            Guarda los productos de catálogo que más te gustan para agregarlos cuando desees.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 h-80 animate-pulse border border-[#EFE9E1]" />
            ))}
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE9E1] max-w-md mx-auto">
            <Heart className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#163E2B] mb-1">
              Aún no has guardado favoritos
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Explora nuestro catálogo y presiona el corazón en cualquier producto para guardarlo aquí.
            </p>
            <Link
              to="/productos"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#C52B66] transition shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explorar Productos</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {favoriteProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
