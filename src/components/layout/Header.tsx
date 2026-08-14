import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Heart,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { AnnouncementBar } from './AnnouncementBar';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount, openCart } = useCart();
  const { favoritesCount } = useFavorites();
  const { user, isAdmin } = useAuth();
  const { categories, brands } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCategoryMenuOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target as Node)
      ) {
        setIsCategoryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/productos?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_2px_15px_rgba(0,0,0,0.03)] border-b border-[#F0EAE1]">
      {/* Top Announcement Bar */}
      <AnnouncementBar />

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#183B2B] hover:bg-[#F9F5F0] rounded-lg transition"
            aria-label="Abrir menú"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo matching screenshot */}
          <Link
            to="/"
            className="flex flex-col items-center md:items-start group transition-transform duration-200"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-2xl sm:text-3xl font-serif text-[#163E2B] font-bold tracking-tight group-hover:text-[#D83173] transition-colors">
                Las 3YR
              </span>
              <Sparkles className="w-4 h-4 text-[#D83173] opacity-80" />
            </div>
            <div className="flex items-center gap-1.5 w-full justify-center md:justify-start">
              <span className="h-[1px] w-3 bg-[#D83173]/50"></span>
              <span className="text-[10px] tracking-[0.25em] text-[#C52B66] font-semibold uppercase">
                DONDE ENITH
              </span>
              <span className="h-[1px] w-3 bg-[#D83173]/50"></span>
            </div>
          </Link>

          {/* Search Bar - Center */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl relative"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="¿Qué producto buscas hoy?"
              className="w-full bg-[#F7F4EF] hover:bg-[#F2EEE7] focus:bg-white text-[#183B2B] text-sm rounded-full pl-5 pr-11 py-2.5 outline-none border border-transparent focus:border-[#D83173]/40 focus:ring-2 focus:ring-[#D83173]/10 transition-all placeholder:text-[#8D9B91]"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64786A] hover:text-[#D83173] transition"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Wishlist Link */}
            <Link
              to="/favoritos"
              className="relative p-2 text-[#183B2B] hover:text-[#D83173] rounded-full hover:bg-[#FAF6F1] transition"
              title="Mis Favoritos"
            >
              <Heart className="w-5 h-5" />
              {favoritesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#D83173] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </Link>

            {/* Account Link */}
            <Link
              to="/cuenta"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#183B2B] hover:text-[#D83173] py-1.5 px-2.5 rounded-full hover:bg-[#FAF6F1] transition"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">
                {user ? user.full_name.split(' ')[0] : 'Mi cuenta'}
              </span>
            </Link>

            {/* Cart Trigger Button matching screenshot */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-2 p-2 sm:px-3.5 sm:py-2 text-[#183B2B] hover:text-[#D83173] bg-[#F7F4EF] hover:bg-[#F1EBE2] rounded-full transition group"
              aria-label="Ver carrito"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-105" />
                <span className="absolute -top-2 -right-2 bg-[#D83173] text-white text-[11px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              </div>
              <span className="hidden lg:inline text-xs font-semibold uppercase tracking-wider text-[#183B2B]">
                Carrito
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-3 md:hidden relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="¿Qué producto buscas hoy?"
            className="w-full bg-[#F7F4EF] text-[#183B2B] text-sm rounded-full pl-4 pr-10 py-2 outline-none border border-transparent focus:border-[#D83173]/40 focus:ring-1 focus:ring-[#D83173]/20 transition placeholder:text-[#8D9B91]"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64786A] hover:text-[#D83173] p-1"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Desktop Navigation Links matching screenshot */}
        <nav className="hidden md:flex items-center justify-center gap-8 mt-3 pt-2.5 border-t border-[#F4EFE9] text-xs font-bold uppercase tracking-[0.14em] text-[#22392A]">
          <Link
            to="/"
            className={`transition-colors py-1 hover:text-[#D83173] ${
              location.pathname === '/' ? 'text-[#D83173] font-black' : ''
            }`}
          >
            INICIO
          </Link>

          {/* Products Dropdown */}
          <div className="relative" ref={categoryMenuRef}>
            <button
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              onMouseEnter={() => setIsCategoryMenuOpen(true)}
              className={`flex items-center gap-1 transition-colors py-1 hover:text-[#D83173] cursor-pointer ${
                location.pathname.startsWith('/productos') ? 'text-[#D83173]' : ''
              }`}
            >
              <span>PRODUCTOS</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isCategoryMenuOpen && (
              <div
                onMouseLeave={() => setIsCategoryMenuOpen(false)}
                className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-[#F0EAE1] py-2 z-50 animate-fade-in"
              >
                <Link
                  to="/productos"
                  className="block px-4 py-2 text-xs font-bold text-[#D83173] hover:bg-[#FDF2F6] transition"
                >
                  VER TODO EL CATÁLOGO →
                </Link>
                <div className="h-[1px] bg-[#F4EFE9] my-1"></div>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categoria/${cat.slug}`}
                    className="block px-4 py-2 text-xs font-medium text-[#22392A] hover:text-[#D83173] hover:bg-[#FAF6F1] transition"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/productos"
            className={`transition-colors py-1 hover:text-[#D83173] ${
              location.pathname === '/productos' ? 'text-[#D83173]' : ''
            }`}
          >
            CATÁLOGO
          </Link>

          <Link
            to="/ofertas"
            className={`flex items-center gap-1 transition-colors py-1 text-[#C52B66] hover:text-[#D83173] ${
              location.pathname === '/ofertas' ? 'font-black underline' : ''
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>OFERTAS</span>
          </Link>

          <Link
            to="/contacto"
            className={`transition-colors py-1 hover:text-[#D83173] ${
              location.pathname === '/contacto' ? 'text-[#D83173]' : ''
            }`}
          >
            CONTACTO
          </Link>
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[110px] bg-black/40 z-50 backdrop-blur-xs">
          <div className="bg-white w-4/5 max-w-sm h-full shadow-2xl p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
              <span className="font-serif text-lg font-bold text-[#163E2B]">Navegación</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-[#64786A] hover:text-[#183B2B] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-3 text-sm font-semibold text-[#22392A]">
              <Link
                to="/"
                className="py-2 px-3 rounded-lg hover:bg-[#FAF6F1] hover:text-[#D83173] transition"
              >
                INICIO
              </Link>
              <Link
                to="/productos"
                className="py-2 px-3 rounded-lg hover:bg-[#FAF6F1] hover:text-[#D83173] transition"
              >
                TODOS LOS PRODUCTOS
              </Link>
              <Link
                to="/ofertas"
                className="py-2 px-3 rounded-lg text-[#C52B66] hover:bg-[#FDF2F6] transition flex items-center justify-between"
              >
                <span>OFERTAS DESTACADAS</span>
                <Flame className="w-4 h-4" />
              </Link>

              <div className="pt-2 pb-1 border-t border-[#F0EAE1]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8D9B91] px-3">
                  Categorías
                </span>
                <div className="mt-2 flex flex-col gap-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/categoria/${cat.slug}`}
                      className="py-1.5 px-3 text-xs font-medium rounded-md hover:bg-[#FAF6F1] hover:text-[#D83173] transition"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-2 pb-1 border-t border-[#F0EAE1]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8D9B91] px-3">
                  Marcas
                </span>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {brands.map((br) => (
                    <Link
                      key={br.id}
                      to={`/marca/${br.slug}`}
                      className="py-1.5 px-3 text-xs font-medium rounded-md hover:bg-[#FAF6F1] hover:text-[#D83173] transition"
                    >
                      {br.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                to="/contacto"
                className="py-2 px-3 rounded-lg hover:bg-[#FAF6F1] hover:text-[#D83173] transition border-t border-[#F0EAE1]"
              >
                CONTACTO & ASESORÍA
              </Link>

              <Link
                to="/cuenta"
                className="py-2 px-3 rounded-lg hover:bg-[#FAF6F1] hover:text-[#D83173] transition"
              >
                MI CUENTA
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
