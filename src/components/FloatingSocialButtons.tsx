import React from 'react';
import { Facebook, MessageCircle } from 'lucide-react';

interface FloatingSocialButtonsProps {
  whatsappNumber?: string;
  facebookUrl?: string;
}

export const FloatingSocialButtons: React.FC<FloatingSocialButtonsProps> = ({
  whatsappNumber,
  facebookUrl
}) => {
  const activeWhatsapp = whatsappNumber?.trim() || '8801712345678';
  const activeFacebook = facebookUrl?.trim() || 'https://facebook.com/himayafashion';
  const cleanWhatsapp = activeWhatsapp.replace(/[^0-9]/g, '');
  const whatsappLink = `https://wa.me/${cleanWhatsapp}?text=Hello%20Himaya%20Fashion,%20I%20would%20like%20to%20inquire%20about%20your%20products.`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto">
      {/* WhatsApp Button */}
      {activeWhatsapp && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat on WhatsApp"
          className="group relative flex items-center justify-center w-12 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
        >
          <MessageCircle className="w-6 h-6 fill-white text-emerald-600" />
          <span className="absolute right-14 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            WhatsApp Chat
          </span>
        </a>
      )}

      {/* Facebook Button */}
      {activeFacebook && (
        <a
          href={activeFacebook}
          target="_blank"
          rel="noopener noreferrer"
          title="Visit Facebook Page"
          className="group relative flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
        >
          <Facebook className="w-5 h-5 fill-white text-blue-600" />
          <span className="absolute right-14 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            Facebook Page
          </span>
        </a>
      )}
    </div>
  );
};
