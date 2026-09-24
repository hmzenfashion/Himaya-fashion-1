import React, { useState } from 'react';
import { Product } from '../types';
import { 
  X, ShoppingBag, Heart, Shield, RefreshCw, Truck, Share2, Copy, Check, 
  MessageCircle, Zap, Eye, Maximize2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string, qty: number, selectedImage?: string) => void;
  onDirectCheckout?: (product: Product, size: string, color: string, qty: number, selectedImage?: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onDirectCheckout,
  isWishlisted,
  onToggleWishlist,
}) => {
  const safeSizes = (product?.sizes && Array.isArray(product.sizes) && product.sizes.length > 0)
    ? product.sizes
    : ['Free Size'];
  const safeColors = (product?.colors && Array.isArray(product.colors) && product.colors.length > 0)
    ? product.colors
    : ['Standard'];

  const [selectedSize, setSelectedSize] = useState(safeSizes[0] || 'Free Size');
  const [selectedColor, setSelectedColor] = useState(safeColors[0] || 'Standard');
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [activeImage, setActiveImage] = useState(product?.image || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerZoom, setViewerZoom] = useState(1);

  // Sync active image if product changes
  React.useEffect(() => {
    if (product) {
      const pSizes = (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0)
        ? product.sizes
        : ['Free Size'];
      const pColors = (product.colors && Array.isArray(product.colors) && product.colors.length > 0)
        ? product.colors
        : ['Standard'];

      setActiveImage(product.image || '');
      setSelectedSize(pSizes[0] || 'Free Size');
      setSelectedColor(pColors[0] || 'Standard');
      setCopiedLink(false);
      setIsViewerOpen(false);
      setViewerZoom(1);
    }
  }, [product?.id, product?.image]);

  if (!product) return null;

  const allImages = Array.from(new Set([product.image, ...(product.images || [])])).filter(Boolean);

  const priceNum = typeof product.price === 'number' && !isNaN(product.price) ? product.price : Number(product.price) || 0;
  const originalPriceNum = typeof product.originalPrice === 'number' && !isNaN(product.originalPrice)
    ? product.originalPrice
    : product.originalPrice ? Number(product.originalPrice) || 0 : 0;

  const hasDiscount = Boolean(originalPriceNum > priceNum);
  const discountPercent = hasDiscount && originalPriceNum > 0
    ? Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100)
    : 0;
  const savings = hasDiscount ? (originalPriceNum - priceNum) : 0;

  // Generate unique product share link
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?product=${product.id}`
    : `?product=${product.id}`;

  const handleCopyLink = async () => {
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
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn("Clipboard copy fallback:", err);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `🛍️ *${product.title}*\n💰 মূল্য: ৳${priceNum.toLocaleString()}${hasDiscount ? ` (আগে ছিল: ৳${originalPriceNum.toLocaleString()} - ${discountPercent}% OFF)` : ''}\n\n👉 সরাসরি প্রডাক্ট দেখতে ও অর্ডার করতে ক্লিক করুন:\n${shareUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `🛍️ ${product.title} - ৳${priceNum.toLocaleString()}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleAdd = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity, activeImage || product.image);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 800);
  };

  const handleInstantBuy = () => {
    if (onDirectCheckout) {
      onDirectCheckout(product, selectedSize, selectedColor, quantity, activeImage || product.image);
      onClose();
    } else {
      handleAdd();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div 
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row max-h-[94vh] md:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-30 p-2 bg-white/90 hover:bg-white rounded-full text-[#1A1A1A] shadow-md transition-all cursor-pointer border border-slate-200 active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Product Image & Gallery Thumbnails */}
          <div className="w-full md:w-1/2 bg-[#F8F7F4] flex flex-col p-3 sm:p-6 border-b md:border-b-0 md:border-r border-[#E6E2DD] md:overflow-y-auto shrink-0">
            {/* Image Container with Full Photo View Option */}
            <div 
              className="relative w-full h-[320px] sm:h-[400px] md:h-[430px] bg-white rounded-xl overflow-hidden shadow-xs border border-[#E8E4DD] flex items-center justify-center cursor-pointer group/img"
              onClick={() => setIsViewerOpen(true)}
            >
              <img
                src={activeImage || product.image}
                alt={product.title}
                className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover/img:scale-105"
              />
              
              {/* Badges on Top-Left */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                {hasDiscount && discountPercent > 0 && (
                  <span className="bg-rose-600 text-white text-xs font-extrabold tracking-wider uppercase px-2.5 py-1 rounded shadow-md">
                    {discountPercent}% OFF
                  </span>
                )}
                {product.badge && (
                  <span className="bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded shadow-md">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Top-Right Maximize Icon: Click to auto view */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsViewerOpen(true);
                }}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full shadow-md backdrop-blur-sm transition-all cursor-pointer border border-white/20 active:scale-95"
                title="ফুল ভিউ দেখতে ক্লিক করুন"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Additional Gallery Pictures Selector */}
            {allImages.length > 1 && (
              <div className="pt-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  <span>Product Gallery ({allImages.length} Photos)</span>
                  <button
                    type="button"
                    onClick={() => setIsViewerOpen(true)}
                    className="text-[#C5A059] hover:underline text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>সব ছবি ফুল ভিউ</span>
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(imgUrl)}
                      className={`relative w-14 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer bg-white ${
                        activeImage === imgUrl ? 'border-[#C5A059] shadow-md scale-105' : 'border-[#E6E2DD] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-contain p-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="w-full md:w-1/2 p-5 sm:p-7 md:p-8 flex flex-col justify-between md:overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest text-[#888] uppercase">
                  {product.category}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-full border transition-colors cursor-pointer ${
                      copiedLink ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'border-[#E6E2DD] text-[#1A1A1A] hover:bg-[#FAF9F6]'
                    }`}
                    title="প্রডাক্টের লিঙ্ক কপি করুন"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onToggleWishlist(product)}
                    className={`p-2 rounded-full border border-[#E6E2DD] transition-colors cursor-pointer ${
                      isWishlisted ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'text-[#1A1A1A] hover:bg-[#FAF9F6]'
                    }`}
                    title="Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] leading-tight">
                {product.title}
              </h2>

              {/* Price with Taka and Discount */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A]">
                    ৳{priceNum.toLocaleString()}
                  </span>
                  {hasDiscount && originalPriceNum > 0 && (
                    <span className="text-base text-[#888] line-through">
                      ৳{originalPriceNum.toLocaleString()}
                    </span>
                  )}
                  {hasDiscount && discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                      Save ৳{savings.toLocaleString()} ({discountPercent}% OFF)
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-[#555] leading-relaxed">
                {product.description}
              </p>

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Select Size: <span className="text-[#C5A059]">{selectedSize}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          selectedSize === size
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                            : 'bg-white text-[#1A1A1A] border-[#E6E2DD] hover:border-[#C5A059]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Select Color: <span className="text-[#C5A059]">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color, cIdx) => (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          if (allImages[cIdx]) {
                            setActiveImage(allImages[cIdx]);
                          }
                        }}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          selectedColor === color
                            ? 'bg-[#C5A059] text-white border-[#C5A059]'
                            : 'bg-white text-[#1A1A1A] border-[#E6E2DD] hover:border-[#C5A059]'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Quantity
                </label>
                <div className="flex items-center w-32 border border-[#E6E2DD] rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-sm font-bold text-[#1A1A1A] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-sm font-bold text-[#1A1A1A] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons: Direct Order Now & Add to Shopping Bag */}
            <div className="pt-5 mt-5 border-t border-[#E6E2DD] space-y-3">
              {/* Primary Direct Order Button */}
              <button
                onClick={handleInstantBuy}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-600/20 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>সরাসরি অর্ডার করুন (Order Now)</span>
              </button>

              {/* Secondary Add to Bag Button */}
              <button
                onClick={handleAdd}
                disabled={addedAnimation}
                className={`w-full py-3 text-xs font-semibold tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-2 border border-[#1A1A1A] cursor-pointer ${
                  addedAnimation ? 'bg-green-600 text-white border-green-600' : 'bg-[#1A1A1A] hover:bg-slate-800 text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{addedAnimation ? 'Added to Bag!' : 'Add to Shopping Bag'}</span>
              </button>

              {/* Clean Product Share Box */}
              <div className="p-3 bg-[#FAF9F6] border border-emerald-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>প্রডাক্ট শেয়ার লিঙ্ক (Share Product)</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Direct Link
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-2.5 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-600 font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-white hover:bg-emerald-700'
                    }`}
                    title="ক্লিক করে লিঙ্ক কপি করুন"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'কপি হয়েছে!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="flex-1 py-1.5 px-2 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp-এ শেয়ার</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="অন্যান্য অ্যাপে শেয়ার করুন"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px] text-[#666]">
                <div className="flex flex-col items-center gap-1 p-2 bg-[#FAF9F6] rounded-lg">
                  <Truck className="w-4 h-4 text-[#C5A059]" />
                  <span>Express Shipping</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-[#FAF9F6] rounded-lg">
                  <RefreshCw className="w-4 h-4 text-[#C5A059]" />
                  <span>Easy Returns</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-[#FAF9F6] rounded-lg">
                  <Shield className="w-4 h-4 text-[#C5A059]" />
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen High-Resolution Lightbox Viewer */}
      {isViewerOpen && (
        <div 
          className="fixed inset-0 z-[80] bg-black/95 flex flex-col justify-between p-2 sm:p-4 backdrop-blur-md animate-fade-in select-none"
          onClick={() => {
            setIsViewerOpen(false);
            setViewerZoom(1);
          }}
        >
          {/* Lightbox Top Bar */}
          <div 
            className="flex items-center justify-between px-2 sm:px-4 py-2 text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold tracking-wide truncate max-w-[180px] sm:max-w-md">
                {product.title}
              </span>
              <span className="text-[10px] sm:text-xs bg-white/20 text-[#E5C98B] px-2 py-0.5 rounded-full font-mono">
                {allImages.indexOf(activeImage) + 1} / {allImages.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-white/10 rounded-full border border-white/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewerZoom(prev => Math.max(1, prev - 0.5))}
                  className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono px-1 sm:px-2 text-white/90">
                  {Math.round(viewerZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setViewerZoom(prev => Math.min(3, prev + 0.5))}
                  className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Close Lightbox */}
              <button
                type="button"
                onClick={() => {
                  setIsViewerOpen(false);
                  setViewerZoom(1);
                }}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer"
                title="বন্ধ করুন (Close)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Stage */}
          <div 
            className="relative flex-1 flex items-center justify-center overflow-hidden p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Image Arrow */}
            {allImages.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const curIdx = allImages.indexOf(activeImage);
                  const prevIdx = (curIdx - 1 + allImages.length) % allImages.length;
                  setActiveImage(allImages[prevIdx]);
                  setViewerZoom(1);
                }}
                className="absolute left-2 sm:left-4 z-20 p-2 sm:p-3 bg-black/60 hover:bg-black text-white rounded-full border border-white/20 transition-all cursor-pointer"
                title="পূর্ববর্তী ছবি"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* High-Resolution Uncropped Full Image */}
            <div 
              className="w-full h-full flex items-center justify-center overflow-auto cursor-zoom-in"
              onClick={() => setViewerZoom(prev => (prev === 1 ? 1.8 : 1))}
            >
              <img
                src={activeImage || product.image}
                alt={product.title}
                style={{ transform: `scale(${viewerZoom})` }}
                className="max-h-[82vh] max-w-[94vw] object-contain transition-transform duration-200 select-none shadow-2xl"
              />
            </div>

            {/* Next Image Arrow */}
            {allImages.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const curIdx = allImages.indexOf(activeImage);
                  const nextIdx = (curIdx + 1) % allImages.length;
                  setActiveImage(allImages[nextIdx]);
                  setViewerZoom(1);
                }}
                className="absolute right-2 sm:right-4 z-20 p-2 sm:p-3 bg-black/60 hover:bg-black text-white rounded-full border border-white/20 transition-all cursor-pointer"
                title="পরবর্তী ছবি"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails & Hint */}
          <div 
            className="px-2 py-3 bg-black/50 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[11px] text-white/70 text-center sm:text-left">
              💡 ছবিতে ট্যাপ করে জুম ইন/আউট করুন। আঙুল বা মাউস দিয়ে সম্পূর্ণ ড্রেসের ফিনিশিং ও ডিজাইন স্পষ্ট দেখুন।
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImage(img);
                      setViewerZoom(1);
                    }}
                    className={`w-12 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 bg-white ${
                      activeImage === img ? 'border-[#C5A059] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Viewer Thumb ${idx + 1}`} className="w-full h-full object-contain p-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
