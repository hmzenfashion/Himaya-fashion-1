import React, { useState } from 'react';
import { Product } from '../types';
import { Flame, Eye, ShoppingBag, Heart, Sparkles, Zap, ArrowRight, Share2, Check } from 'lucide-react';

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

  // Filter out invalid products
  const realProducts = products.filter(p => p && p.title);
  if (realProducts.length === 0) return null;

  // 1. Gather all admin-selected popular products (isPopular, isPinned, or badge containing 'popular')
  const adminPopular = realProducts.filter(
    p => Boolean(
      p.isPopular === true || 
      (p as any).isPopular === 'true' || 
      p.isPinned === true || 
      (p as any).isPinned === 'true' || 
      (p.badge && /popular|পপুলার/i.test(p.badge))
    )
  );

  // 2. User request: "এডমিন যতগুলো ক্লেইম সেকশনে ক্লিক করবে, সবগুলাই যেন পপুলার লিস্টে থাকে।"
  // Display ALL products selected by admin as popular! If none selected yet, show top 5 items.
  const popularProducts = adminPopular.length > 0 
    ? adminPopular 
    : realProducts.slice(0, 5);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [animatingHeartId, setAnimatingHeartId] = useState<string | null>(null);

  const handleShare = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?product=${product.id}`
      : `?product=${product.id}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl);
      }
      setCopiedId(product.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(product.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent, product: Product, isWishlisted: boolean) => {
    e.stopPropagation();
    if (!isWishlisted) {
      setAnimatingHeartId(product.id);
      setTimeout(() => setAnimatingHeartId(null), 700);
    }
    onToggleWishlist(product);
  };

  return (
    <section aria-label="Popular Products" className="w-full bg-[#FAF9F6] pt-8 pb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Prominent Highlighting Container with Extra Luxury Gold Top Border */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#FFFDF9] via-white to-[#FAF8F5] border-2 border-[#C5A059]/70 shadow-xl shadow-amber-950/5 overflow-hidden">
          
          {/* Extra Decorative Top Gradient Border Line (Gold & Rose Shimmer) */}
          <div className="h-1.5 sm:h-2 w-full bg-gradient-to-r from-[#B38728] via-[#FDF3A9] via-[#DAA520] to-[#B38728] shadow-xs" />

          <div className="p-4 sm:p-7 md:p-8 space-y-6">
            
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#EBE6DF]">
              <div className="space-y-1.5">
                {/* Highlight Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/40 text-amber-900 text-xs font-black uppercase tracking-wider shadow-2xs">
                  <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
                  <span>পপুলার কালেকশন &middot; POPULAR PICKS</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight flex items-center gap-2.5 flex-wrap">
                  <span>জনপ্রিয় ও ট্রেন্ডিং কালেকশন</span>
                  <span className="text-[#C5A059] font-sans text-base sm:text-lg font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    ★ {popularProducts.length}টি পণ্য
                  </span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                  গ্রাহকদের সর্বাধিক পছন্দের কালেকশন — অ্যাডমিন অনুমোদিত ও সরাসরি অর্ডারযোগ্য
                </p>
              </div>

              {/* Counter Pill */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>{popularProducts.length}টি পপুলার পণ্য প্রদর্শিত</span>
                </span>
              </div>
            </div>

            {/* Responsive Popular Product Grid (2 columns on mobile, 3 on sm, 4 on md, 5 on lg) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {popularProducts.map((product, index) => {
                const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
                const discountPercent = hasDiscount && product.originalPrice
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;
                const isWishlisted = wishlist.some(w => w.id === product.id);
                const isHeartAnimating = animatingHeartId === product.id;

                // Alternative preview image on hover
                const allImages = Array.from(new Set([product.image, ...(product.images || [])])).filter(Boolean);
                const primaryImage = product.image || allImages[0] || '';
                const altImage = allImages.length > 1 ? allImages[1] : null;

                return (
                  <div
                    key={product.id}
                    className="group relative bg-white rounded-2xl border-2 border-[#EBE6DF] hover:border-[#C5A059] overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Image Area */}
                    <div 
                      className="relative aspect-[3/4] bg-[#F4F4F0] overflow-hidden cursor-pointer"
                      onClick={() => onSelectProduct(product)}
                    >
                      {/* Primary Image */}
                      <img
                        src={primaryImage}
                        alt={product.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />

                      {/* Alternative Hover Image */}
                      {altImage && (
                        <img
                          src={altImage}
                          alt={`${product.title} - Preview`}
                          className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out pointer-events-none"
                          loading="lazy"
                        />
                      )}

                      {/* Rank & Discount Badges */}
                      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                        <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 ring-1 ring-white/60">
                          <Flame className="w-3 h-3 fill-white" />
                          <span>#{index + 1} পপুলার</span>
                        </span>

                        {hasDiscount && discountPercent > 0 && (
                          <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs">
                            {discountPercent}% OFF
                          </span>
                        )}

                        {product.badge && !/popular|পপুলার/i.test(product.badge) && (
                          <span className="bg-slate-900/90 backdrop-blur-xs text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md shadow-xs">
                            {product.badge}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons: Wishlist & Share */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                        <button
                          type="button"
                          onClick={(e) => handleWishlistClick(e, product, isWishlisted)}
                          className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                            isWishlisted ? 'bg-[#C5A059] text-white' : 'bg-white/90 text-[#1A1A1A] hover:bg-white'
                          } ${isHeartAnimating ? 'animate-heartbeat ring-2 ring-[#C5A059]/50 shadow-md' : 'active:scale-90'}`}
                          aria-label="Wishlist"
                          title={isWishlisted ? "Wishlist থেকে সরান" : "Add to Wishlist"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''} ${isHeartAnimating ? 'animate-heartbeat' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleShare(e, product)}
                          className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                            copiedId === product.id ? 'bg-emerald-600 text-white' : 'bg-white/90 text-[#1A1A1A] hover:bg-white'
                          }`}
                          aria-label="Share Link"
                          title={copiedId === product.id ? "লিঙ্ক কপি হয়েছে!" : "শেয়ার লিঙ্ক কপি করুন"}
                        >
                          {copiedId === product.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Hover Quick View overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                        <div className="px-3 py-1.5 bg-white/95 text-[#1A1A1A] font-bold text-[11px] rounded-full shadow-lg flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>বিস্তারিত</span>
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="text-[10px] font-semibold text-[#888] uppercase tracking-wider truncate mb-0.5">
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

                        {/* Order & Cart Action Buttons */}
                        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
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
        </div>

      </div>
    </section>
  );
};
