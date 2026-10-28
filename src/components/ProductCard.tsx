import React, { useState } from 'react';
import { Product } from '../types';
import { Heart, ShoppingBag, Eye, Share2, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [altImageError, setAltImageError] = useState(false);
  const [primaryImageError, setPrimaryImageError] = useState(false);

  // Compute all available images for alternative hover preview
  const allImages = Array.from(
    new Set([product.image, ...(product.images || [])])
  ).filter(Boolean);

  const primaryImage = product.image || allImages[0] || '';
  const altImage = allImages.length > 1 ? allImages[1] : null;
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercent = hasDiscount && product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?product=${product.id}`
      : `?product=${product.id}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="group relative bg-white border border-[#E6E2DD] rounded-lg sm:rounded-xl overflow-hidden shadow-xs hover:shadow-xl hover:scale-[1.03] transition-all duration-300 flex flex-col">
      {/* Image Container */}
      <div 
        className="relative aspect-[3/4] bg-[#F4F4F0] overflow-hidden cursor-pointer"
        onClick={() => onSelect(product)}
      >
        {/* Primary Image */}
        <img
          src={primaryImageError ? 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=800' : primaryImage}
          alt={product.title}
          onError={() => setPrimaryImageError(true)}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Alternative Image Hover Preview */}
        {altImage && !altImageError && (
          <img
            src={altImage}
            alt={`${product.title} - Alternative Preview`}
            onError={() => setAltImageError(true)}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out pointer-events-none"
            loading="lazy"
          />
        )}

        {/* Subtle Multi-view Indicator Badge */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] text-white font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
            <span>+{allImages.length - 1} view</span>
          </div>
        )}

        {/* Badges Container */}
        <div className="absolute top-1 left-1 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 z-10">
          {hasDiscount && discountPercent > 0 && (
            <span className="bg-rose-600 text-white text-[7px] sm:text-[10px] font-extrabold uppercase px-1 sm:px-2 py-0.5 rounded shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.badge && (
            <span className="bg-[#1A1A1A] text-white text-[7px] sm:text-[9px] font-bold uppercase px-1 sm:px-2 py-0.5 rounded shadow-xs truncate max-w-[65px] sm:max-w-none">
              {product.badge}
            </span>
          )}
        </div>

        {/* Action Buttons Top Right: Wishlist & Share */}
        <div className="absolute top-1 right-1 sm:top-2.5 sm:right-2.5 flex flex-col gap-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className={`p-1 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-xs ${
              isWishlisted ? 'bg-[#C5A059] text-white' : 'bg-white/85 text-[#1A1A1A] hover:bg-white'
            }`}
            aria-label="Wishlist"
            title="Add to Wishlist"
          >
            <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShareClick}
            className={`p-1 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-xs cursor-pointer ${
              copiedLink ? 'bg-emerald-600 text-white' : 'bg-white/85 text-[#1A1A1A] hover:bg-white'
            }`}
            aria-label="Share Link"
            title={copiedLink ? "লিঙ্ক কপি হয়েছে!" : "প্রডাক্টের লিঙ্ক কপি করুন"}
          >
            {copiedLink ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />}
          </button>
        </div>

        {/* Quick View Button: No text overlay, clicking auto-views */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="pointer-events-auto p-2.5 sm:p-3 bg-white/95 hover:bg-white text-[#1A1A1A] rounded-full shadow-lg backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-all cursor-pointer border border-[#E6E2DD]"
            aria-label="View Product"
            title="ভিউ করতে ক্লিক করুন"
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1A1A]" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-1.5 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[8px] sm:text-[10px] font-semibold tracking-wider text-[#888] uppercase truncate mb-0.5">
            {product.category}
          </div>
          <h3 
            className="font-serif text-[11px] sm:text-sm md:text-base font-semibold text-[#1A1A1A] hover:text-[#C5A059] transition-colors line-clamp-1 cursor-pointer leading-tight"
            onClick={() => onSelect(product)}
            title={product.title}
          >
            {product.title}
          </h3>
        </div>

        <div className="mt-1.5 sm:mt-3 flex items-center justify-between pt-1 sm:pt-2.5 border-t border-[#F0ECE6] gap-1">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5 min-w-0">
            <span className="text-[11px] sm:text-sm md:text-base font-extrabold text-[#1A1A1A] truncate">
              ৳{(typeof product.price === 'number' ? product.price : Number(product.price) || 0).toLocaleString()}
            </span>
            {hasDiscount && product.originalPrice && (
              <span className="text-[8px] sm:text-[11px] text-[#999] line-through truncate">
                ৳{(typeof product.originalPrice === 'number' ? product.originalPrice : Number(product.originalPrice) || 0).toLocaleString()}
              </span>
            )}
          </div>

          <button
            onClick={() => onAddToCart(
              product,
              (product.sizes && product.sizes[0]) || 'Free Size',
              (product.colors && product.colors[0]) || 'Standard'
            )}
            className="p-1 sm:p-2 bg-[#1A1A1A] text-white rounded-md hover:bg-[#C5A059] transition-colors shadow-xs cursor-pointer shrink-0"
            title="Add to Bag"
          >
            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
