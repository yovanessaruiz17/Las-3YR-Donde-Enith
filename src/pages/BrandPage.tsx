import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Brand, Product } from '../types';
import { storeService } from '../services/storeService';
import { ProductCard } from '../components/product/ProductCard';

export const BrandPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      storeService.getBrandBySlug(slug),
      storeService.getProducts({ brandSlug: slug }),
    ]).then(([br, prods]) => {
      setBrand(br);
      setProducts(prods);
      setLoading(false);
    });
  }, [slug]);

  if (!brand && !loading) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#163E2B] mb-2">Marca no encontrada</h2>
        <Link
          to="/productos"
          className="inline-block px-6 py-2.5 rounded-full bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider mt-4"
        >
          Explorar catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF8] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs text-[#8D9B91] mb-6">
          <Link to="/" className="hover:text-[#163E2B]">
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/productos" className="hover:text-[#163E2B]">
            Marcas
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#163E2B] font-semibold">{brand?.name}</span>
        </nav>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EFE9E1] mb-10 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D83173] block mb-1">
            Marca de Catálogo
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#163E2B] mb-2">
            {brand?.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#546A5B] max-w-2xl">
            {brand?.description}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 h-80 animate-pulse border border-[#EFE9E1]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE9E1] max-w-md mx-auto">
            <p className="text-sm font-semibold text-[#163E2B]">No hay productos registrados para esta marca en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
