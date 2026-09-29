import React from 'react';
import { Product } from '../types';
import { Flame, Eye, ShoppingBag, Heart, Pin, Sparkles, Zap } from 'lucide-react';

interface PopularProductsSectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  onDirectCheckout?: (product: Product, size: string, color: string) => void;
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
}

export const PopularProductsSection: React.FC<PopularProductsSectionProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onDirectCheckout,
  wishlist,
  onToggleWishlist,
}) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="w-full bg-gradient-to-b from-[#FAF8F5] via-white to-[#FAF8F5] border-b border-[#E6E2DD] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8 border-b border-[#EBE6DF] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-500/30 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2 shadow-xs">
              <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-500 rotate-45" />
              <span>Pinned Products &middot; পিন করা স্পেশাল কালেকশন</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight flex items-center gap-2 flex-wrap">
              <span>Pinned Collection</span>
              <span className="text-amber-600 font-sans text-base sm:text-xl font-bold">(Most Popular)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              অ্যাডমিন প্যানেল থেকে পিন করা সেরা আকর্ষণীয় পণ্যসমূহ — সরাসরি অর্ডার করুন
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg flex items-center gap-1">
              <Pin className="w-3 h-3 text-amber-600 fill-amber-500" />
              <span>{products.length}টি পিন করা পণ্য</span>
            </span>
          </div>
        </div>

        {/* Side-by-side responsive grid: 2 on mobile, 3 on md, 4 on lg */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((product, index) => {
            const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
            const discountPercent = hasDiscount && product.originalPrice
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : 0;
            const isWishlisted = wishlist.some(w => w.id === product.id);

            return (
              <div
                key={product.id}
                className="group relative bg-white rounded-2xl border border-[#E6E2DD] hover:border-[#C5A059] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Container with Badges */}
                <div 
                  className="relative aspect-[3/4] bg-[#F4F4F0] overflow-hidden cursor-pointer"
                  onClick={() => onSelectProduct(product)}
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                    <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 ring-1 ring-white/60">
                      <Pin className="w-3 h-3 fill-current rotate-45" />
                      <span>#{index + 1} Pinned</span>
                    </span>

                    {hasDiscount && discountPercent > 0 && (
                      <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs">
                        {discountPercent}% OFF
                      </span>
                    )}

                    {product.badge && product.badge.toLowerCase() !== 'new' && (
                      <span className="bg-slate-900/90 backdrop-blur-xs text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md shadow-xs">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(product);
                    }}
                    className={`absolute top-2 right-2 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-xs z-10 cursor-pointer ${
                      isWishlisted ? 'bg-[#C5A059] text-white' : 'bg-white/90 text-[#1A1A1A] hover:bg-white'
                    }`}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>

                  {/* Hover Quick View overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/15">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct(product);
                      }}
                      className="px-3.5 py-1.5 bg-white text-[#1A1A1A] font-bold text-xs rounded-full shadow-lg hover:bg-[#C5A059] hover:text-white transition-all transform scale-90 group-hover:scale-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>বিস্তারিত দেখুন</span>
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[10px] font-semibold text-[#888] uppercase tracking-wider truncate mb-1">
                      {product.category}
                    </div>
                    <h3
                      className="font-serif text-xs sm:text-sm font-bold text-[#1A1A1A] hover:text-[#C5A059] transition-colors line-clamp-2 cursor-pointer leading-snug"
                      onClick={() => onSelectProduct(product)}
                      title={product.title}
                    >
                      {product.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-[#F0ECE6] space-y-2">
                    {/* Price */}
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm sm:text-base font-extrabold text-[#1A1A1A]">
                        ৳{(typeof product.price === 'number' ? product.price : Number(product.price) || 0).toLocaleString()}
                      </span>
                      {hasDiscount && product.originalPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          ৳{(typeof product.originalPrice === 'number' ? product.originalPrice : Number(product.originalPrice) || 0).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDirectCheckout) {
                            onDirectCheckout(
                              product,
                              product.sizes?.[0] || 'Standard',
                              product.colors?.[0] || 'Default'
                            );
                          } else {
                            onSelectProduct(product);
                          }
                        }}
                        className="w-full py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>অর্ডার</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(
                            product,
                            product.sizes?.[0] || 'Standard',
                            product.colors?.[0] || 'Default'
                          );
                        }}
                        className="w-full py-1.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-[11px] font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>কার্ট</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
