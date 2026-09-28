import React from 'react';
import { Product } from '../types';
import { Sparkles, Flame, ChevronRight, Eye, ShoppingBag, Heart } from 'lucide-react';

interface PopularProductsSectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
}

export const PopularProductsSection: React.FC<PopularProductsSectionProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  wishlist,
  onToggleWishlist,
}) => {
  // Pinned products are top priority as popular products
  const pinnedProducts = products.filter(p => p.isPinned || p.isPopular);
  const otherProducts = products.filter(p => !p.isPinned && !p.isPopular);

  // Combine to create the Top 10 Popular Products list
  const popularList = [...pinnedProducts, ...otherProducts].slice(0, 10);

  if (popularList.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-[#FAF9F6] via-white to-[#FAF9F6] border-y border-[#E6E2DD] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Top 10 Popular Products &middot; জনপ্রিয় পণ্য</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
              Popular Collection (জনপ্রিয় কালেকশন)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              গ্রাহকদের সর্বাধিক পছন্দের ও ট্রেন্ডিং শীর্ষ ১০টি এক্সক্লুসিভ কালেকশন
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              মোট {popularList.length}টি জনপ্রিয় পণ্য
            </span>
          </div>
        </div>

        {/* Horizontal scroll container with peek cards */}
        <div className="flex gap-3 sm:gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-slate-200">
          {popularList.map((product, index) => {
            const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
            const discountPercent = hasDiscount && product.originalPrice
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : 0;
            const isWishlisted = wishlist.some(w => w.id === product.id);

            return (
              <div
                key={product.id}
                className="group relative flex-shrink-0 w-44 sm:w-56 md:w-64 bg-white rounded-2xl border border-[#E6E2DD] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 snap-start flex flex-col"
              >
                {/* Image & Rank Badge */}
                <div 
                  className="relative aspect-[3/4] bg-[#F4F4F0] overflow-hidden cursor-pointer"
                  onClick={() => onSelectProduct(product)}
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Rank / Top badge */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-current" />
                      <span>#{index + 1} Popular</span>
                    </span>

                    {hasDiscount && discountPercent > 0 && (
                      <span className="bg-rose-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-xs w-max">
                        {discountPercent}% OFF
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
                    className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all shadow-xs z-10 cursor-pointer ${
                      isWishlisted ? 'bg-[#C5A059] text-white' : 'bg-white/90 text-[#1A1A1A] hover:bg-white'
                    }`}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>

                  {/* Hover Quick View overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct(product);
                      }}
                      className="px-3.5 py-1.5 bg-white text-[#1A1A1A] font-bold text-xs rounded-full shadow-lg hover:bg-[#C5A059] hover:text-white transition-all transform scale-90 group-hover:scale-100"
                    >
                      বিস্তারিত দেখুন
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[9px] sm:text-[10px] font-semibold text-[#888] uppercase tracking-wider truncate mb-1">
                      {product.category}
                    </div>
                    <h3
                      className="font-serif text-xs sm:text-sm font-semibold text-[#1A1A1A] hover:text-[#C5A059] transition-colors line-clamp-1 cursor-pointer leading-tight"
                      onClick={() => onSelectProduct(product)}
                      title={product.title}
                    >
                      {product.title}
                    </h3>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#F0ECE6] flex items-center justify-between gap-1">
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-extrabold text-[#1A1A1A]">
                        ৳{(typeof product.price === 'number' ? product.price : Number(product.price) || 0).toLocaleString()}
                      </span>
                      {hasDiscount && product.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through">
                          ৳{(typeof product.originalPrice === 'number' ? product.originalPrice : Number(product.originalPrice) || 0).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      অর্ডার করুন
                    </button>
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
