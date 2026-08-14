import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

export const BrandBar: React.FC = () => {
  const { brands } = useStore();
  const activeBrands = brands.filter((b) => b.active);

  return (
    <section className="py-12 bg-[#FAF8F5] border-b border-[#F0EAE1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="font-serif text-center text-xl sm:text-2xl font-bold text-[#163E2B] mb-8">
          Trabajamos con las mejores marcas
        </h3>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {activeBrands.map((brand) => (
            <Link
              key={brand.id}
              to={`/marca/${brand.slug}`}
              className="group flex flex-col items-center justify-center transition-transform hover:scale-105 duration-200"
            >
              <div className="px-5 py-2.5 rounded-xl bg-white/70 hover:bg-white border border-[#EFE9E1] group-hover:border-[#D83173]/30 shadow-2xs group-hover:shadow-xs transition">
                <span className="font-serif text-base sm:text-lg lg:text-xl font-black tracking-wider text-[#163E2B] group-hover:text-[#D83173] uppercase">
                  {brand.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
