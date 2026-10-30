import React from 'react';
import { Facebook, MessageCircle, ShoppingBag } from 'lucide-react';

interface FloatingSocialButtonsProps {
  whatsappNumber?: string;
  facebookUrl?: string;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const FloatingSocialButtons: React.FC<FloatingSocialButtonsProps> = ({
  whatsappNumber,
  facebookUrl,
  cartCount = 0,
  onOpenCart
}) => {
  const activeWhatsapp = whatsappNumber?.trim() || '8801712345678';
  const activeFacebook = facebookUrl?.trim() || 'https://facebook.com/himayafashion';
  const cleanWhatsapp = activeWhatsapp.replace(/[^0-9]/g, '');
  const whatsappLink = `https://wa.me/${cleanWhatsapp}?text=Hello%20Himaya%20Fashion,%20I%20would%20like%20to%20inquire%20about%20your%20products.`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
      {/* Facebook Button (Small) */}
      {activeFacebook && (
        <a
          href={activeFacebook}
          target="_blank"
          rel="noopener noreferrer"
          title="Visit Facebook Page"
          className="group relative flex items-center justify-center w-9 h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-md transition-all duration-300 hover:scale-110 cursor-pointer"
        >
          <Facebook className="w-4 h-4 fill-white text-blue-600" />
          <span className="absolute right-11 bg-slate-900 text-white text-[11px] font-semibold px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            Facebook Page
          </span>
        </a>
      )}

      {/* Floating Action Row: Bag Button + WhatsApp Button together */}
      <div className="flex items-center gap-2">
        {/* Compact Bag Button */}
        {onOpenCart && (
          <button
            onClick={onOpenCart}
            type="button"
            aria-label="Shopping Bag"
            title="Shopping Bag (ব্যাগ)"
            className="group relative flex items-center justify-center w-11 h-11 bg-[#1A1A1A] hover:bg-[#C5A059] text-white rounded-full shadow-lg border border-[#C5A059]/40 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
            
            {/* Bag Item Counter Badge */}
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 shadow-md border-2 border-white animate-pulse">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}

            {/* Tooltip */}
            <span className="absolute bottom-full mb-2 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
              ব্যাগ {cartCount > 0 ? `(${cartCount})` : ''}
            </span>
          </button>
        )}

        {/* WhatsApp Button */}
        {activeWhatsapp && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp"
            className="group relative flex items-center justify-center w-11 h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
            <span className="absolute bottom-full mb-2 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
              WhatsApp Chat
            </span>
          </a>
        )}
      </div>
    </div>
  );
};
