import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Filter, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { storeService } from '../services/storeService';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHead } from '../components/common/SEOHead';

export const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, brands } = useStore();

  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('categoria') || '';
  const brandParam = searchParams.get('marca') || '';
  const sortParam = searchParams.get('orden') || 'popular';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    setLoading(true);
    storeService
      .getProducts({
        search: searchQuery,
        categorySlug: categoryParam,
        brandSlug: brandParam,
        sortBy: sortParam,
      })
      .then((data) => {
        setProducts(data);
        setCurrentPage(1);
        setLoading(false);
      });
  }, [searchQuery, categoryParam, brandParam, sortParam]);

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('marca', val);
    else newParams.delete('marca');
    setSearchParams(newParams);
  };

  const handleCategoryChange = (slug: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (slug) newParams.set('categoria', slug);
    else newParams.delete('categoria');
    setSearchParams(newParams);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('orden', val);
    else newParams.delete('orden');
    setSearchParams(newParams);
  };

  // Pagination calculation
  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage]);

  const activeCategoryObj = (categories || []).find((c) => c.slug === categoryParam);
  const pageTitle = activeCategoryObj
    ? activeCategoryObj.name
    : searchQuery
    ? `Búsqueda: "${searchQuery}"`
    : brandParam
    ? `Marca: ${brandParam.toUpperCase()}`
    : 'Catálogo de Productos';

  return (
    <div className="min-h-screen bg-[#FCFAF8] py-6 sm:py-10">
      <SEOHead
        title={`${pageTitle} | Las 3YR Tienda Online`}
        description={`Explora nuestro catálogo exclusivo de ${pageTitle}. Belleza, fragancias y hogar 100% originales en Colombia. Pagos por Nequi, Llave y Contraentrega.`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb matching screenshot */}
        <nav className="flex items-center gap-1.5 text-xs text-[#8D9B91] mb-6">
          <Link to="/" className="hover:text-[#163E2B] transition">
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/productos" className="hover:text-[#163E2B] transition">
            Categorías
          </Link>
          {activeCategoryObj && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#163E2B] font-semibold">{activeCategoryObj.name}</span>
            </>
          )}
          {searchQuery && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#163E2B] font-semibold truncate max-w-[150px]">
                "{searchQuery}"
              </span>
            </>
          )}
        </nav>

        {/* Top Header Section matching screenshot */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#163E2B] mb-2">
            {pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#546A5B] max-w-2xl">
            {activeCategoryObj?.description ||
              'Encuentra lo mejor en cuidado facial, corporal, maquillaje y más de tus marcas favoritas de catálogo.'}
          </p>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              !categoryParam
                ? 'bg-[#163E2B] text-white shadow-xs'
                : 'bg-white text-[#22392A] border border-[#EFE9E1] hover:border-[#D83173]/30'
            }`}
          >
            Todas las categorías
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                categoryParam === cat.slug
                  ? 'bg-[#163E2B] text-white shadow-xs'
                  : 'bg-white text-[#22392A] border border-[#EFE9E1] hover:border-[#D83173]/30'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Filters and Sorting Controls matching screenshot */}
        <div className="bg-white rounded-2xl p-4 border border-[#EFE9E1] mb-8 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand Filter */}
          <div className="w-full sm:w-auto flex items-center gap-3">
            <label htmlFor="brand-filter" className="text-xs font-medium text-[#64786A] whitespace-nowrap">
              Filtrar por marca
            </label>
            <select
              id="brand-filter"
              value={brandParam}
              onChange={handleBrandChange}
              className="bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs font-semibold text-[#163E2B] py-2 px-3 outline-none focus:border-[#D83173] transition cursor-pointer w-full sm:w-48"
            >
              <option value="">Todas</option>
              {brands.map((br) => (
                <option key={br.id} value={br.slug}>
                  {br.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="w-full sm:w-auto flex items-center gap-3 justify-end">
            <label htmlFor="sort-filter" className="text-xs font-medium text-[#64786A] whitespace-nowrap">
              Ordenar por
            </label>
            <select
              id="sort-filter"
              value={sortParam}
              onChange={handleSortChange}
              className="bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs font-semibold text-[#163E2B] py-2 px-3 outline-none focus:border-[#D83173] transition cursor-pointer w-full sm:w-48"
            >
              <option value="popular">Más vendidos</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
            </select>
          </div>
        </div>

        {/* Products Grid matching screenshot (3 columns on desktop) */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 h-80 animate-pulse border border-[#EFE9E1]"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE9E1] max-w-md mx-auto my-12">
            <Sparkles className="w-10 h-10 text-[#D83173] mx-auto mb-3 opacity-60" />
            <h3 className="font-serif text-lg font-bold text-[#163E2B] mb-1">
              No encontramos productos
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Intenta cambiar los filtros o el término de búsqueda para ver más opciones disponibles.
            </p>
            <button
              onClick={() => {
                setSearchParams(new URLSearchParams());
              }}
              className="px-6 py-2.5 rounded-full bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#C52B66] transition shadow-xs cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {paginatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}

        {/* Pagination matching screenshot `< 1 2 3 ... >` */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Página anterior"
              className="p-2 rounded-xl border border-[#E4DDD3] bg-white text-[#163E2B] hover:bg-[#FAF8F5] disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-[#D83173] text-white shadow-xs'
                      : 'bg-white border border-[#E4DDD3] text-[#163E2B] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Página siguiente"
              className="p-2 rounded-xl border border-[#E4DDD3] bg-white text-[#163E2B] hover:bg-[#FAF8F5] disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
