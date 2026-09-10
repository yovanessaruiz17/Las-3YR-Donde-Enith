import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ShoppingBag,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { INITIAL_BANNERS } from '../../data/initialData';
import { Banner } from '../../types';

export const Hero: React.FC = () => {
  const { banners = [], settings } = useStore();

  // Filter active banners and sort by sort_order
  const activeBanners: Banner[] = useMemo(() => {
    const list = (banners || []).filter((b) => b.active !== false);
    const sorted = list.length > 0 ? [...list] : [...INITIAL_BANNERS];
    return sorted.sort((a, b) => (a.sort_order || 1) - (b.sort_order || 1));
  }, [banners]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1); // 1 = forward, -1 = backward
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure currentIndex stays within bounds if banner list changes
  useEffect(() => {
    if (currentIndex >= activeBanners.length) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Autoplay interval management
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      handleNext();
    }, 6000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [activeBanners.length, isPaused, handleNext]);

  // Touch swipe handling for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  // Helper to highlight words or render cleanly
  const renderBannerTitle = (title: string) => {
    if (!title) return 'Belleza, hogar y estilo que te acompañan cada día';

    // Check if title has commas or phrase endings to add pink italic elegance
    const words = title.split(' ');
    if (words.length > 4) {
      const mainPart = words.slice(0, words.length - 2).join(' ');
      const highlightPart = words.slice(words.length - 2).join(' ');
      return (
        <>
          {mainPart}{' '}
          <span className="text-[#D83173] font-serif italic block sm:inline">
            {highlightPart}
          </span>
        </>
      );
    }

    return title;
  };

  return (
    <section
      id="hero-banner-slider"
      className="relative overflow-hidden bg-gradient-to-r from-[#FAF6F0] via-[#FCF8F5] to-[#FDF2F5] border-b border-[#F0EAE1] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="Banners destacados de Las 3YR"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FCE7F0]/40 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#E8F3EB]/40 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 lg:py-16 relative z-10">
        {/* Floating Side Arrows for quick slider navigation */}
        {activeBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Banner anterior"
              className="hidden sm:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#163E2B] shadow-md hover:shadow-xl border border-[#E2D8CD] items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Siguiente banner"
              className="hidden sm:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#163E2B] shadow-md hover:shadow-xl border border-[#E2D8CD] items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div className="min-h-[460px] sm:min-h-[420px] lg:min-h-[460px] flex items-center">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentBanner.id || currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
              transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              {/* Left Column: Text & CTA */}
              <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-center lg:text-left">
                {/* Tag / Badge */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FCE7F0] text-[#C52B66] text-xs font-semibold tracking-wide border border-[#FAD0E0]/60 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[280px] sm:max-w-none">
                    {currentBanner.tag || 'Las mejores marcas de catálogo'}
                  </span>
                </div>

                {/* Display Headline */}
                <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-[#163E2B] leading-[1.18] tracking-tight">
                  {renderBannerTitle(currentBanner.title)}
                </h1>

                {/* Subtitle / Description */}
                <p className="text-sm sm:text-base text-[#4E6154] max-w-lg mx-auto lg:mx-0 leading-relaxed font-sans">
                  {currentBanner.description ||
                    'Descubre productos de las mejores marcas de catálogo seleccionados para ti en Cartagena.'}
                </p>

                {/* Action CTA buttons */}
                <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                  <Link
                    id={`hero-cta-btn-${currentBanner.id || currentIndex}`}
                    to={currentBanner.button_url || '/productos'}
                    className="w-full sm:w-auto px-7 sm:px-8 py-3.5 rounded-full bg-[#D83173] hover:bg-[#C52B66] text-white text-xs sm:text-sm font-bold tracking-widest uppercase shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-center flex items-center justify-center gap-2 group"
                  >
                    <span>{currentBanner.button_text || 'EXPLORAR PRODUCTOS'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    to="/ofertas"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-[#FAF6F1] text-[#163E2B] border border-[#E2D8CD] text-xs sm:text-sm font-semibold tracking-wider uppercase transition text-center shadow-2xs hover:border-[#163E2B]/40 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#D83173]" />
                    <span>Ver Ofertas</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Hero Image Composition */}
              <div className="lg:col-span-6 relative flex items-center justify-center">
                <div className="relative w-full max-w-lg lg:max-w-none">
                  {/* Glowing ambient background card */}
                  <div className="absolute -inset-3 bg-gradient-to-tr from-[#FCE7F0]/80 via-white/50 to-[#E8F3EB]/80 rounded-3xl blur-xl -z-10" />

                  <div className="relative rounded-3xl overflow-hidden shadow-xl border border-white/80 bg-white/60 backdrop-blur-xs aspect-4/3 sm:aspect-16/10 flex items-center justify-center p-3 sm:p-5">
                    <img
                      src={
                        currentBanner.image_url ||
                        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80'
                      }
                      alt={currentBanner.title}
                      className="w-full h-full object-cover rounded-2xl shadow-inner transition-transform duration-700 hover:scale-102"
                      loading="eager"
                    />

                    {/* Floating City & Dispatch Badge */}
                    <div className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-[#F0EAE1] flex items-center gap-2.5 max-w-[85%]">
                      <div className="w-7 h-7 rounded-full bg-[#163E2B] text-[#A3E635] flex items-center justify-center shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] uppercase font-bold text-[#8D9B91] tracking-wider leading-tight">
                          {settings.city || 'Cartagena de Indias'}
                        </p>
                        <p className="text-xs font-bold text-[#163E2B] leading-tight">
                          Envíos directos DiDi / inDrive
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Navigation Bottom Bar (Controls & Dots) */}
        {activeBanners.length > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 sm:mt-8 pt-4 border-t border-[#F0EAE1]/80">
            {/* Left: Previous / Next Buttons */}
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <button
                id="hero-slider-prev-btn"
                type="button"
                onClick={handlePrev}
                aria-label="Banner anterior"
                className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#163E2B] border border-[#E2D8CD] hover:border-[#163E2B] shadow-2xs hover:shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95 group"
              >
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
              </button>

              <button
                id="hero-slider-next-btn"
                type="button"
                onClick={handleNext}
                aria-label="Siguiente banner"
                className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#163E2B] border border-[#E2D8CD] hover:border-[#163E2B] shadow-2xs hover:shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95 group"
              >
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Pause / Play autoplay button */}
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                aria-label={isPaused ? 'Reanudar rotación automática' : 'Pausar rotación automática'}
                title={isPaused ? 'Reanudar rotación' : 'Pausar rotación'}
                className="w-10 h-10 rounded-full bg-white/70 hover:bg-white text-stone-500 hover:text-[#163E2B] border border-[#E2D8CD] transition-all flex items-center justify-center cursor-pointer active:scale-95 text-xs ml-1"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Center: Slide Indicator Dots */}
            <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
              {activeBanners.map((banner, index) => {
                const isActive = index === currentIndex;
                return (
                  <button
                    key={banner.id || index}
                    id={`hero-dot-${index}`}
                    type="button"
                    onClick={() => goToSlide(index)}
                    aria-label={`Ir al banner ${index + 1}: ${banner.title}`}
                    title={banner.title}
                    className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D83173] focus:ring-offset-2 ${
                      isActive
                        ? 'w-8 h-2.5 bg-[#D83173] shadow-xs'
                        : 'w-2.5 h-2.5 bg-[#163E2B]/20 hover:bg-[#163E2B]/40'
                    }`}
                  />
                );
              })}
            </div>

            {/* Right: Counter Badge (e.g. 01 / 03) */}
            <div className="order-3 hidden sm:flex items-center gap-2 text-xs font-mono font-bold text-[#163E2B] bg-white/80 px-3.5 py-1.5 rounded-full border border-[#E2D8CD] shadow-2xs">
              <span className="text-[#D83173]">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>
              <span className="text-stone-300">/</span>
              <span className="text-stone-500">
                {String(activeBanners.length).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
