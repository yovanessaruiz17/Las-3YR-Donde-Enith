import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  MessageCircle,
  Home,
  Grid,
  Tag,
  Phone,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { AnnouncementBar } from './AnnouncementBar';
import { InstallAppButton } from '../common/PWAInstallPrompt';

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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
      setIsMobileMenuOpen(false);
    }
  };

  const handleSearch = handleSearchSubmit;

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

      {/* Mobile Navigation Drawer - Full Height Top-to-Bottom */}
      {isMobileMenuOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="mobile-nav-drawer-root">
            {/* Backdrop */}
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            />

            {/* Drawer Panel - 100% Top to Bottom */}
            <div className="relative w-full max-w-md h-full h-[100dvh] max-h-[100dvh] bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
              {/* Header section - fixed top */}
              <div className="p-5 border-b border-[#F0EAE1] bg-[#FAF8F5] shrink-0 relative">
                <div className="flex items-center justify-between mb-4">
                  {/* Green Title Pill Badge */}
                  <div className="mx-auto bg-[#163E2B] text-white px-6 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase shadow-xs">
                    MENÚ DE NAVEGACIÓN
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="absolute right-4 top-4 p-2 text-stone-500 hover:text-[#163E2B] hover:bg-stone-200/60 rounded-full transition cursor-pointer"
                    aria-label="Cerrar menú"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Local Cartagena Delivery Notice */}
                <div className="bg-[#FAF6F0] border border-[#EBE1D5] rounded-xl px-3 py-2 text-[11px] text-stone-600 flex items-center justify-between mb-2">
                  <span className="font-semibold text-[#163E2B]">📍 Las 3YR • Donde Enith</span>
                  <span className="text-[10px] text-[#D83173] font-bold uppercase">Solo Cartagena</span>
                </div>

                {/* Search Bar inside Drawer */}
                <form onSubmit={handleSearchSubmit} className="relative mt-2">
                  <input
                    type="text"
                    placeholder="¿Qué producto buscas hoy? (ej: Perfume, Crema...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-[#E8E1D7] text-[#163E2B] placeholder:text-stone-400 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#D83173] focus:ring-2 focus:ring-[#D83173]/10 transition shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </form>
              </div>

              {/* Scrollable Body - Expands to fill available vertical space */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
                {/* Main Navigation Links */}
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-3.5 bg-[#FAF8F5] rounded-xl border border-[#F0EAE1] hover:bg-white hover:border-[#D83173]/30 transition shadow-2xs"
                  >
                    <Home className="w-4 h-4 text-[#163E2B]" />
                    <span className="text-xs font-bold text-[#163E2B]">INICIO</span>
                  </Link>

                  <Link
                    to="/productos"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-3.5 bg-[#FAF8F5] rounded-xl border border-[#F0EAE1] hover:bg-white hover:border-[#D83173]/30 transition shadow-2xs"
                  >
                    <Grid className="w-4 h-4 text-[#163E2B]" />
                    <span className="text-xs font-bold text-[#163E2B]">CATÁLOGO</span>
                  </Link>

                  <Link
                    to="/ofertas"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="col-span-2 flex items-center justify-between p-3.5 bg-[#FDF2F6] rounded-xl border border-[#F8BBD0] text-[#C52B66] font-bold text-xs transition hover:bg-[#FCE4EC] shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#D83173]" />
                      <span>OFERTAS DESTACADAS</span>
                    </div>
                    <span className="text-[10px] bg-white text-[#D83173] px-2.5 py-1 rounded-md shadow-2xs font-black">
                      VER OFERTAS
                    </span>
                  </Link>
                </div>

                {/* Categories */}
                <div className="pt-2 border-t border-[#F0EAE1]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8D9B91] px-1 block mb-2">
                    Categorías de Belleza
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/categoria/${cat.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#FDF2F6] hover:text-[#D83173] text-stone-700 text-xs font-semibold transition truncate border border-[#F0EAE1] hover:border-[#D83173]/20 flex items-center justify-between"
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-[10px] text-stone-400">→</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div className="pt-2 border-t border-[#F0EAE1]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8D9B91] px-1 block mb-2">
                    Nuestras Marcas Originales
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {brands.map((br) => (
                      <Link
                        key={br.id}
                        to={`/marca/${br.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EAF2ED] hover:text-[#163E2B] text-stone-700 text-xs font-bold text-center transition truncate border border-[#F0EAE1] hover:border-[#163E2B]/20"
                      >
                        {br.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Contact & Account Links */}
                <div className="pt-2 border-t border-[#F0EAE1] space-y-2">
                  <Link
                    to="/contacto"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] hover:bg-white text-stone-700 text-xs font-semibold transition border border-[#F0EAE1]"
                  >
                    <Phone className="w-4 h-4 text-stone-500" />
                    <span>Contacto y Asesoría</span>
                  </Link>

                  <Link
                    to="/cuenta"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] hover:bg-white text-stone-700 text-xs font-semibold transition border border-[#F0EAE1]"
                  >
                    <User className="w-4 h-4 text-stone-500" />
                    <span>{user ? `Mi Cuenta (${user.full_name.split(' ')[0]})` : 'Iniciar Sesión'}</span>
                  </Link>
                </div>
              </div>

              {/* Drawer Footer - Fixed bottom */}
              <div className="p-4 sm:p-5 border-t border-[#F0EAE1] bg-[#FAF8F5] shrink-0 space-y-2.5">
                <a
                  href="https://wa.me/573244456597?text=Hola%20Do%C3%B1a%20Enith%2C%20quisiera%20asesor%C3%ADa%20sobre%20los%20productos."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-2xl font-bold text-xs transition shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>ASESORÍA POR WHATSAPP</span>
                </a>

                <InstallAppButton
                  label="Instalar App en el Celular"
                  variant="primary"
                  className="w-full justify-center py-2.5 text-xs rounded-2xl shadow-xs"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
