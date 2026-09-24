import React, { useState, useEffect } from 'react';
import { BannerAd } from '../types';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Download, Smartphone } from 'lucide-react';

interface HeroProps {
  banners: BannerAd[];
  onShopClick: () => void;
  onDownloadAppClick?: () => void;
  isAppDownloadEnabled?: boolean;
  appButtonText?: string;
}

export const Hero: React.FC<HeroProps> = ({ 
  banners, 
  onShopClick,
  onDownloadAppClick,
  isAppDownloadEnabled,
  appButtonText = "Download apps"
}) => {
  const activeBanners = banners.filter(b => b.active);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[currentIndex] || activeBanners[0];

  return (
    <div className="relative bg-[#1A1A1A] text-white overflow-hidden min-h-[500px] sm:min-h-[600px] flex items-center">
      {/* Background image with cinematic dark overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={current.image}
          alt={current.title}
          className="w-full h-full object-cover object-center opacity-40 scale-105 transition-all duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{current.tag || "New Collection"}</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            {current.title}
          </h1>

          <p className="text-[#D1D1D1] text-base sm:text-lg font-light leading-relaxed max-w-xl">
            {current.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={onShopClick}
              className="px-8 py-3.5 bg-[#C5A059] hover:bg-[#B08D44] text-white text-sm font-semibold tracking-wider uppercase rounded-none transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>{current.linkText || "Shop Collection"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('product-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-3.5 bg-transparent hover:bg-white/10 text-white border border-white/30 text-sm font-semibold tracking-wider uppercase transition-all cursor-pointer"
            >
              Discover All
            </button>

            {isAppDownloadEnabled !== false && onDownloadAppClick && (
              <button
                onClick={onDownloadAppClick}
                className="px-6 py-3.5 bg-white/10 hover:bg-[#C5A059] text-white border border-[#C5A059]/60 text-sm font-semibold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 backdrop-blur-sm shadow-md"
                title="Download apps - অফিশিয়াল অ্যাপ ডাউনলোড করুন"
              >
                <Smartphone className="w-4 h-4 text-[#E5C98B]" />
                <span>{appButtonText}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Carousel Navigation indicators */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
          <button
            onClick={() => setCurrentIndex((currentIndex - 1 + activeBanners.length) % activeBanners.length)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-1.5">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === idx ? 'w-6 bg-[#C5A059]' : 'w-1.5 bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentIndex((currentIndex + 1) % activeBanners.length)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
