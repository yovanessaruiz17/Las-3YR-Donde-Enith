import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

export const CategoryExplorer: React.FC = () => {
  const { categories } = useStore();
  const activeCategories = categories.filter((c) => c.active).slice(0, 6);

  return (
    <section className="py-12 sm:py-16 bg-[#FCFAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading matching screenshot */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#163E2B]">
            Explora por Categorías
          </h2>
          <div className="w-12 h-0.5 bg-[#D83173] mx-auto mt-3 rounded-full"></div>
        </div>

        {/* 6 Category Cards Grid matching screenshot */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {activeCategories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categoria/${cat.slug}`}
              className="group flex flex-col items-center text-center bg-white rounded-2xl p-3 sm:p-4 border border-[#EFE9E1] hover:border-[#D83173]/40 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Category Image Container with rounded shape */}
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#FAF8F5] mb-3 relative">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
              </div>

              {/* Category Name */}
              <span className="text-xs sm:text-sm font-bold text-[#163E2B] group-hover:text-[#D83173] transition-colors leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

        {/* View All Button matching screenshot */}
        <div className="mt-8 sm:mt-10 text-center">
          <Link
            to="/productos"
            className="inline-block px-8 py-3 rounded-full border border-[#D83173] text-[#D83173] hover:bg-[#D83173] hover:text-white text-xs font-bold tracking-widest uppercase transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer"
          >
            VER TODAS LAS CATEGORÍAS
          </Link>
        </div>
      </div>
    </section>
  );
};
