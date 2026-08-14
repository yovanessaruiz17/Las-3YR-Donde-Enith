import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Check, ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useStore } from '../../context/StoreContext';
import { storeService } from '../../services/storeService';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useStore();
  const [addedAnimation, setAddedAnimation] = useState(false);

  const favorited = isFavorite(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setAddedAnimation(true);
    showToast(`"${product.name}" agregado al carrito`, 'success');
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
    showToast(
      favorited ? 'Eliminado de tus favoritos' : 'Agregado a tus favoritos ❤️',
      'info'
    );
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-[#EFE9E1] p-3 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#E2D8CD]">
      {/* Favorite Heart Button - Top Right matching screenshot */}
      <button
        onClick={handleToggleFavorite}
        className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-stone-400 hover:text-[#D83173] hover:bg-white shadow-2xs transition group/heart"
        aria-label="Agregar a favoritos"
      >
        <Heart
          className={`w-4 h-4 transition-transform duration-200 group-hover/heart:scale-110 ${
            favorited ? 'fill-[#D83173] text-[#D83173]' : ''
          }`}
        />
      </button>

      {/* Discount Badge */}
      {product.compare_price && product.compare_price > product.price && (
        <div className="absolute top-3.5 left-3.5 z-10 bg-[#D83173] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-2xs">
          -{Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}%
        </div>
      )}

      {/* Product Image Link */}
      <Link to={`/producto/${product.slug}`} className="block relative overflow-hidden rounded-xl mb-3">
        <div className="aspect-square w-full bg-[#FAF8F5] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <img
            src={product.main_image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>

      {/* Info Section */}
      <div className="flex-1 flex flex-col text-center">
        {/* Brand Name matching screenshot */}
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#163E2B]/80 mb-1">
          {product.brand_name || 'Catálogo'}
        </span>

        {/* Product Title */}
        <Link
          to={`/producto/${product.slug}`}
          className="text-xs sm:text-sm font-bold text-[#163E2B] line-clamp-2 hover:text-[#D83173] transition-colors mb-2 min-h-[36px]"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Pricing */}
        <div className="mt-auto mb-3 flex items-baseline justify-center gap-1.5 flex-wrap">
          <span className="text-sm sm:text-base font-extrabold text-[#163E2B]">
            {storeService.formatCurrency(product.price)}
          </span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-[11px] text-stone-400 line-through">
              {storeService.formatCurrency(product.compare_price)}
            </span>
          )}
        </div>
      </div>

      {/* Action Button matching screenshot: Pink pill outline button */}
      <button
        onClick={handleAddToCart}
        className={`w-full py-2 px-3 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
          addedAnimation
            ? 'bg-[#163E2B] text-white border border-[#163E2B]'
            : 'border border-[#D83173] text-[#D83173] hover:bg-[#D83173] hover:text-white'
        }`}
      >
        {addedAnimation ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>AGREGADO</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-3.5 h-3.5 hidden sm:inline" />
            <span>{compact ? 'AGREGAR' : 'AGREGAR AL CARRITO'}</span>
          </>
        )}
      </button>
    </div>
  );
};
