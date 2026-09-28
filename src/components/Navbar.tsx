import React, { useState } from 'react';
import { ShoppingBag, Heart, Search, ShieldCheck, Menu, X, User, Sparkles, LogIn, LogOut, Truck, Smartphone, Download, Flame } from 'lucide-react';
import { StoreSettings } from '../types';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAdmin: () => void;
  onOpenFirebaseGuide?: () => void;
  onOpenTracking?: () => void;
  onOpenInstallApp?: () => void;
  settings?: StoreSettings;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
  currentUser?: { 
    email?: string | null; 
    displayName?: string | null; 
    photoURL?: string | null;
    phoneNumber?: string | null;
    authProvider?: 'google' | 'phone' | 'email';
  } | null;
  isAdminUser?: boolean;
  onSignIn?: () => void;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAdmin,
  onOpenTracking,
  onOpenInstallApp,
  settings,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  currentUser,
  isAdminUser,
  onSignIn,
  onSignInGoogle,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const appButtonLabel = settings?.appButtonText || "Download apps";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E6E2DD] transition-all">
      {/* Top announcement bar */}
      <div className="bg-[#1A1A1A] text-[#FAF9F6] text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
          <div className="flex items-center justify-center gap-1.5 tracking-wider uppercase font-medium text-[11px] sm:text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
            <span>Delivery Charge: Inside Dhaka ৳80 &middot; Outside Dhaka ৳150 &middot; Cash on Delivery Available</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Mobile menu & Category nav triggers */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#1A1A1A] hover:text-[#C5A059] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium tracking-wide uppercase">
            <button
              onClick={() => { setSelectedCategory('All'); }}
              className={`transition-colors py-2 border-b-2 ${
                selectedCategory === 'All' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-[#1A1A1A] hover:text-[#C5A059]'
              }`}
            >
              All Collection
            </button>
            {categories.filter(c => c !== 'All').map(cat => {
              const isPop = cat.includes('Popular') || cat.includes('জনপ্রিয়');
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`transition-colors py-2 border-b-2 flex items-center gap-1.5 ${
                    isSelected 
                      ? (isPop ? 'border-amber-500 text-amber-600 font-bold' : 'border-[#C5A059] text-[#C5A059]')
                      : (isPop ? 'border-transparent text-amber-700 hover:text-amber-600 font-semibold' : 'border-transparent text-[#1A1A1A] hover:text-[#C5A059]')
                  }`}
                >
                  {isPop && <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </nav>

          {/* Center: Brand Logo */}
          <div className="flex-1 lg:flex-none text-center">
            <a href="#" className="inline-flex items-center gap-2 sm:gap-2.5 group">
              <img 
                src="/icons/logo.png" 
                alt="Himaya Fashion" 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-[#C5A059]/40 shadow-xs group-hover:scale-105 transition-transform"
              />
              <div className="text-left">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-[#1A1A1A] group-hover:text-[#C5A059] transition-colors leading-none block">
                  HIMAYA
                </span>
                <span className="block text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-[#666] mt-0.5 font-semibold">
                  Fashion
                </span>
              </div>
            </a>
          </div>

          {/* Right: Search, Wishlist, Cart, User Account / Admin */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Search Input toggle */}
            <div className="relative hidden md:flex items-center">
              <input
                type="text"
                placeholder="Search luxury pieces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 lg:w-56 pl-9 pr-4 py-1.5 text-xs bg-[#FAF9F6] border border-[#E6E2DD] rounded-full focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"
              />
              <Search className="absolute left-3 w-3.5 h-3.5 text-[#888]" />
            </div>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 text-[#1A1A1A] hover:text-[#C5A059] transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenTracking}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E6E2DD] text-[#1A1A1A] hover:border-[#C5A059] hover:text-[#C5A059] transition-colors cursor-pointer"
              title="Track Order"
            >
              <Truck className="w-4 h-4 text-[#C5A059]" />
              <span>Track Order</span>
            </button>

            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-[#1A1A1A] hover:text-[#C5A059] transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#C5A059] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="relative p-2 text-[#1A1A1A] hover:text-[#C5A059] transition-colors flex items-center gap-1.5 bg-[#FAF9F6] px-3 py-1.5 rounded-full border border-[#E6E2DD]"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-semibold">{cartCount}</span>
            </button>

            {/* User Login & Admin Access */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* If user is an authorized Admin: show Admin Panel button */}
                {isAdminUser ? (
                  <button
                    onClick={onOpenAdmin}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white rounded-full transition-all shadow-xs cursor-pointer"
                    title="Open Admin Dashboard"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin</span>
                  </button>
                ) : null}

                {/* Account Avatar / Phone badge */}
                <div 
                  className="px-2.5 py-1 rounded-full bg-slate-100 border border-[#E6E2DD] flex items-center gap-1.5 text-xs font-bold text-slate-800" 
                  title={`Logged in as: ${currentUser.displayName || currentUser.email || currentUser.phoneNumber}`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[10px] flex items-center justify-center font-bold overflow-hidden">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      (currentUser.displayName || currentUser.email || currentUser.phoneNumber || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:inline font-mono text-[11px] font-medium text-slate-700 max-w-[100px] truncate">
                    {currentUser.displayName || currentUser.phoneNumber || currentUser.email?.split('@')[0]}
                  </span>
                </div>

                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              /* Regular customer / Not logged in: Show login button */
              (onSignIn || onSignInGoogle) && (
                <button
                  onClick={onSignIn || onSignInGoogle}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-[#E6E2DD] text-[#1A1A1A] hover:border-[#C5A059] hover:text-[#C5A059] transition-colors cursor-pointer"
                  title="Sign In or Register"
                >
                  <User className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="hidden sm:inline font-semibold">Sign In / Up</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div className="pb-4 md:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Search luxury pieces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DD] rounded-full focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                autoFocus
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#888]" />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E6E2DD] px-4 pt-4 pb-6 space-y-3 shadow-lg">
          <div className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">Categories</div>
          <button
            onClick={() => { setSelectedCategory('All'); setMobileMenuOpen(false); }}
            className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              selectedCategory === 'All' ? 'bg-[#C5A059] text-white' : 'text-[#1A1A1A] hover:bg-[#FAF9F6]'
            }`}
          >
            All Collection
          </button>
          {categories.filter(c => c !== 'All').map(cat => {
            const isPop = cat.includes('Popular') || cat.includes('জনপ্রিয়');
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setMobileMenuOpen(false); }}
                className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  isSelected 
                    ? (isPop ? 'bg-amber-500 text-white font-bold' : 'bg-[#C5A059] text-white')
                    : (isPop ? 'text-amber-800 bg-amber-50/70 hover:bg-amber-100 font-semibold' : 'text-[#1A1A1A] hover:bg-[#FAF9F6]')
                }`}
              >
                <div className="flex items-center gap-2">
                  {isPop && <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />}
                  <span>{cat}</span>
                </div>
                {isPop && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-950">
                    Trending
                  </span>
                )}
              </button>
            );
          })}

          {/* User Account / Admin links in mobile menu */}
          <div className="pt-4 border-t border-[#E6E2DD] flex flex-col gap-2">
            <button
              onClick={() => { onOpenTracking?.(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#FAF9F6] border border-[#E6E2DD] text-[#1A1A1A] text-xs font-semibold rounded-md hover:border-[#C5A059] hover:text-[#C5A059] transition-colors"
            >
              <Truck className="w-4 h-4 text-[#C5A059]" />
              <span>Track Order (অর্ডার ট্র্যাক করুন)</span>
            </button>

            {/* ONLY show Admin Dashboard button if the logged-in user is an admin */}
            {currentUser && isAdminUser && (
              <button
                onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#1A1A1A] text-white text-xs font-semibold rounded-md hover:bg-[#C5A059] transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin Dashboard</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs">
                <span className="text-slate-600 truncate">{currentUser.email}</span>
                {onSignOut && (
                  <button
                    onClick={() => { onSignOut(); setMobileMenuOpen(false); }}
                    className="text-red-600 font-semibold hover:underline"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              onSignInGoogle && (
                <button
                  onClick={() => { onSignInGoogle(); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#E6E2DD] text-[#1A1A1A] text-xs font-medium rounded-md hover:bg-slate-50"
                >
                  <User className="w-4 h-4 text-[#C5A059]" />
                  <span>Sign In with Google</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
};
