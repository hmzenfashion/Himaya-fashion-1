import React, { useState } from 'react';
import { Mail, ArrowRight, Instagram, Facebook, Twitter, ShieldCheck, RefreshCw, Truck } from 'lucide-react';

interface FooterProps {
  onOpenTracking?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTracking }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#1A1A1A] text-[#FAF9F6] pt-16 pb-12 border-t border-[#333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Features highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-[#333]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-white">Nationwide Delivery</h4>
              <p className="text-xs text-[#999]">Inside Dhaka ৳80 & Outside Dhaka ৳150</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-white">Exquisite Returns</h4>
              <p className="text-xs text-[#999]">Hassle-free 30-day return policy</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-white">Secure Authentication</h4>
              <p className="text-xs text-[#999]">Encrypted checkout & data privacy</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold tracking-wider text-white">HIMAYA</h3>
            <p className="text-xs text-[#999] leading-relaxed">
              Timeless elegance, Italian craftsmanship, and modern sustainable couture designed for the discerning individual.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="p-2 rounded-full bg-[#2A2A2A] hover:bg-[#C5A059] text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-[#2A2A2A] hover:bg-[#C5A059] text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-[#2A2A2A] hover:bg-[#C5A059] text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-white mb-4">Collections</h4>
            <ul className="space-y-2.5 text-xs text-[#999]">
              <li><a href="#" className="hover:text-[#C5A059] transition-colors">Autumn-Winter '26</a></li>
              <li><a href="#" className="hover:text-[#C5A059] transition-colors">Silk & Cashmere Edit</a></li>
              <li><a href="#" className="hover:text-[#C5A059] transition-colors">Tailored Blazers</a></li>
              <li><a href="#" className="hover:text-[#C5A059] transition-colors">Evening Gowns</a></li>
              <li><a href="#" className="hover:text-[#C5A059] transition-colors">Accessories & Totes</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-white mb-4">Client Care</h4>
            <ul className="space-y-2.5 text-xs text-[#999]">
              <li><button onClick={onOpenTracking} className="hover:text-[#C5A059] transition-colors text-left cursor-pointer">Track Your Order</button></li>
              <li><a href="#" className="hover:text-[#C5A059] transition-colors">Shipping & Delivery</a></li>
              <li><a href="#" className="hover:text-[#C5A059] transition-colors">Exchanges & Returns</a></li>
              <li><a href="#" className="hover:text-[#C5A059] transition-colors">Size Guide & Fit</a></li>
              <li><a href="#" className="hover:text-[#C5A059] transition-colors">Private Styling Concierge</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-white mb-4">The Himaya Journal</h4>
            <p className="text-xs text-[#999]">Subscribe to receive private previews, seasonal lookbooks, and invitation-only releases.</p>
            {subscribed ? (
              <div className="p-3 bg-[#C5A059]/20 border border-[#C5A059] text-[#C5A059] text-xs rounded-lg text-center font-semibold">
                Thank you for subscribing to Himaya.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#2A2A2A] border border-[#3A3A3A] text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                  />
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-[#888]" />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#C5A059] hover:bg-[#B08D44] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-[#333] flex flex-col sm:flex-row items-center justify-between text-xs text-[#888] gap-4">
          <div>
            &copy; {new Date().getFullYear()} Himaya Fashion Inc. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
