import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { storeService } from '../../services/storeService';
import { ProductCard } from '../product/ProductCard';

export const FeaturedProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeService.getProducts({ featured: true }).then((data) => {
      setProducts(data.slice(0, 6));
      setLoading(false);
    });
  }, []);

  return (
    <section className="py-12 sm:py-16 bg-white border-t border-b border-[#F0EAE1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title matching screenshot */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#163E2B]">
            Productos Destacados
          </h2>
          <div className="w-12 h-0.5 bg-[#D83173] mx-auto mt-3 rounded-full"></div>
        </div>

        {/* Grid matching screenshot */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-[#FAF8F5] rounded-2xl p-4 h-72 animate-pulse border border-[#EFE9E1]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        )}

        {/* View All Button matching screenshot */}
        <div className="mt-10 sm:mt-12 text-center">
          <Link
            to="/productos"
            className="inline-block px-8 py-3 rounded-full border border-[#D83173] text-[#D83173] hover:bg-[#D83173] hover:text-white text-xs font-bold tracking-widest uppercase transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer"
          >
            VER TODOS LOS PRODUCTOS
          </Link>
        </div>
      </div>
    </section>
  );
};
