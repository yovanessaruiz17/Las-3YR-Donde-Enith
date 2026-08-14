import React, { useState, useEffect } from 'react';
import { Truck, Sparkles, ShieldCheck, Tag, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const ICON_MAP: Record<string, React.ElementType> = {
  Truck,
  Sparkles,
  ShieldCheck,
  Tag,
  Heart,
};

export const AnnouncementBar: React.FC = () => {
  const { announcements } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeAnnouncements = announcements.filter((a) => a.active);

  useEffect(() => {
    if (activeAnnouncements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeAnnouncements.length, isPaused]);

  if (activeAnnouncements.length === 0) return null;

  const current = activeAnnouncements[currentIndex] || activeAnnouncements[0];
  const IconComponent = current.icon && ICON_MAP[current.icon] ? ICON_MAP[current.icon] : Sparkles;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeAnnouncements.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
  };

  return (
    <div
      className="bg-[#F8F4F0] border-b border-[#EFE9E1] text-[#22392A] text-xs font-medium py-2 px-4 select-none relative transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          aria-label="Mensaje anterior"
          className="text-[#64786A] hover:text-[#183B2B] p-1 rounded-full hover:bg-black/5 transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Current Rotating Announcement */}
        <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden text-center min-h-[20px]">
          <div
            key={current.id}
            className="flex items-center justify-center gap-2 transition-all duration-500 transform animate-fade-in"
          >
            <IconComponent className="w-3.5 h-3.5 text-[#183B2B] shrink-0" />
            <span className="tracking-wide text-xs sm:text-sm font-medium">{current.message}</span>
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          aria-label="Mensaje siguiente"
          className="text-[#64786A] hover:text-[#183B2B] p-1 rounded-full hover:bg-black/5 transition"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
