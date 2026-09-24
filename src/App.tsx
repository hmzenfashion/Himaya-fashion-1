import React, { useState, useEffect } from 'react';
import { Product, CartItem, BannerAd, Order, StoreSettings, AdConfiguration } from './types';
import { initialProducts, initialBanners, initialAdConfig } from './data/initialData';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminDashboard } from './components/AdminDashboard';
import { FirebaseGuideModal } from './components/FirebaseGuideModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AuthModal } from './components/AuthModal';
import { InstallAppModal } from './components/InstallAppModal';
import { Footer } from './components/Footer';
import { FloatingSocialButtons } from './components/FloatingSocialButtons';
import { AdManager } from './components/AdManager';
import { Sparkles, SlidersHorizontal, Heart, X, Database } from 'lucide-react';
import { User } from 'firebase/auth';
import {
  subscribeToProducts,
  subscribeToOrders,
  subscribeToBanners,
  subscribeToStoreSettings,
  subscribeToAdConfig,
  fetchProductsFromFirestore,
  fetchOrdersFromFirestore,
  fetchBannersFromFirestore,
  fetchStoreSettings,
  fetchAdConfig,
  saveAdConfig,
  seedProductsIfEmpty,
  seedBannersIfEmpty,
  testConnection,
  signInWithGoogle,
  signOutUser,
  subscribeToAuth,
  fetchAdminEmails,
  saveAdminEmails,
  isEmailAdmin,
  DEFAULT_ADMIN_EMAILS,
  CustomerUser,
  getStoredCustomer,
  clearStoredCustomer
} from './firebase';

export const sanitizeProduct = (p: any): Product => {
  const price = typeof p?.price === 'number' && !isNaN(p.price) ? p.price : Number(p?.price) || 0;
  const originalPrice = typeof p?.originalPrice === 'number' && !isNaN(p.originalPrice)
    ? p.originalPrice
    : (p?.originalPrice ? Number(p.originalPrice) || undefined : undefined);

  const rawSizes = Array.isArray(p?.sizes)
    ? p.sizes
    : (typeof p?.sizes === 'string' ? p.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
  const safeSizes = rawSizes.length > 0 ? rawSizes.map(String) : ['Free Size'];

  const rawColors = Array.isArray(p?.colors)
    ? p.colors
    : (typeof p?.colors === 'string' ? p.colors.split(',').map((c: string) => c.trim()).filter(Boolean) : []);
  const safeColors = rawColors.length > 0 ? rawColors.map(String) : ['Standard'];

  return {
    id: String(p?.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
    title: String(p?.title || 'Himaya Luxury Apparel'),
    category: String(p?.category || 'General'),
    price,
    originalPrice,
    image: String(p?.image || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800'),
    images: Array.isArray(p?.images) ? p.images.map(String) : [],
    description: String(p?.description || ''),
    badge: p?.badge ? String(p.badge) : undefined,
    sizes: safeSizes,
    colors: safeColors,
    stock: typeof p?.stock === 'number' && !isNaN(p.stock) ? p.stock : 10,
    featured: Boolean(p?.featured)
  };
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | undefined>(undefined);
  const [adConfig, setAdConfig] = useState<AdConfiguration>(() => {
    try {
      const cached = localStorage.getItem('himaya_ad_config');
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return initialAdConfig;
  });
  const [loading, setLoading] = useState(true);

  // Authentication: Firebase Auth (Admins/Google) + Customer User (Phone/Google)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(() => getStoredCustomer());
  const [adminEmails, setAdminEmails] = useState<string[]>(DEFAULT_ADMIN_EMAILS);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Cart & Wishlist state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high'>('featured');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFirebaseGuideOpen, setIsFirebaseGuideOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isInstallAppOpen, setIsInstallAppOpen] = useState(false);

  const [isFirebaseSyncActive, setIsFirebaseSyncActive] = useState(false);

  const fetchData = async () => {
    try {
      let firestoreFetched = false;
      // 1. Fetch directly from Firebase Firestore
      try {
        const [fbProds, fbOrders, fbBans, fbSets, fbEmails, fbAds] = await Promise.all([
          fetchProductsFromFirestore(),
          fetchOrdersFromFirestore(),
          fetchBannersFromFirestore(),
          fetchStoreSettings(),
          fetchAdminEmails(),
          fetchAdConfig().catch(() => null)
        ]);
        if (fbProds) {
          setProducts(fbProds.map(sanitizeProduct));
          firestoreFetched = true;
        }
        if (fbOrders) setOrders(fbOrders);
        if (fbBans) setBanners(fbBans);
        if (fbSets) setStoreSettings(fbSets);
        if (fbEmails && fbEmails.length > 0) setAdminEmails(fbEmails);
        if (fbAds) setAdConfig(fbAds);
      } catch (fbErr) {
        console.warn("Firestore direct query error during fetch:", fbErr);
      }

      // 2. Only fetch API fallback/cache if Firestore was not available
      if (!firestoreFetched) {
        const [prodRes, bannerRes, orderRes, settingsRes, adsRes] = await Promise.all([
          fetch('/api/products').catch(() => null),
          fetch('/api/banners').catch(() => null),
          fetch('/api/orders').catch(() => null),
          fetch('/api/settings').catch(() => null),
          fetch('/api/ads').catch(() => null)
        ]);
        if (prodRes && prodRes.ok) {
          const prodData = await prodRes.json().catch(() => null);
          if (Array.isArray(prodData)) setProducts(prodData.map(sanitizeProduct));
        }
        if (bannerRes && bannerRes.ok) {
          const bannerData = await bannerRes.json().catch(() => null);
          if (Array.isArray(bannerData)) setBanners(bannerData);
        }
        if (orderRes && orderRes.ok) {
          const orderData = await orderRes.json().catch(() => null);
          if (Array.isArray(orderData)) setOrders(orderData);
        }
        if (settingsRes && settingsRes.ok) {
          const settingsData = await settingsRes.json().catch(() => null);
          if (settingsData) setStoreSettings(settingsData);
        }
        if (adsRes && adsRes.ok) {
          const adsData = await adsRes.json().catch(() => null);
          if (adsData) setAdConfig(adsData);
        }
      }

      // Guarantee fallback products and banners are always populated (especially on static hosts like Netlify)
      setProducts(prev => (prev && prev.length > 0 ? prev.map(sanitizeProduct) : initialProducts.map(sanitizeProduct)));
      setBanners(prev => (prev && prev.length > 0 ? prev : initialBanners));
    } catch (err) {
      console.error("Failed to fetch data fallback", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubProducts: (() => void) | null = null;
    let unsubOrders: (() => void) | null = null;
    let unsubBanners: (() => void) | null = null;
    let unsubSettings: (() => void) | null = null;
    let unsubAds: (() => void) | null = null;
    let unsubAuth: (() => void) | null = null;

    // 1. Initial quick load from local cache/API
    fetchData();

    // 2. Auth listener for Google Account
    try {
      unsubAuth = subscribeToAuth((user) => {
        setCurrentUser(user);
        if (user) {
          setCustomerUser({
            id: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Customer',
            email: user.email,
            phoneNumber: user.phoneNumber,
            authProvider: 'google'
          });
        }
      });
      fetchAdminEmails().then((emails) => {
        if (emails && emails.length > 0) {
          setAdminEmails(emails);
        }
      });
      fetchStoreSettings().then((sets) => {
        if (sets) setStoreSettings(sets);
      });
    } catch (err) {
      console.warn("Auth initialization note:", err);
    }

    // 3. Initialize Firebase Firestore & subscribe
    const initFirebaseData = async () => {
      try {
        await testConnection();
        setIsFirebaseSyncActive(true);

        // Ensure database has default items if empty
        await seedProductsIfEmpty();
        await seedBannersIfEmpty();

        // Subscribe to real-time changes
        unsubProducts = subscribeToProducts((prods) => {
          if (prods) {
            setProducts(prods.map(sanitizeProduct));
            setLoading(false);
          }
        });

        unsubOrders = subscribeToOrders((ords) => {
          if (ords) {
            setOrders(ords);
          }
        });

        unsubBanners = subscribeToBanners((bans) => {
          if (bans) {
            setBanners(bans);
          }
        });

        unsubSettings = subscribeToStoreSettings((sets) => {
          if (sets) {
            setStoreSettings(sets);
          }
        });

        unsubAds = subscribeToAdConfig((conf) => {
          if (conf) {
            setAdConfig(conf);
          }
        });
      } catch (err) {
        console.warn("Firestore listener initialization note:", err);
      }
    };

    initFirebaseData();

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubOrders) unsubOrders();
      if (unsubBanners) unsubBanners();
      if (unsubSettings) unsubSettings();
      if (unsubAds) unsubAds();
      if (unsubAuth) unsubAuth();
    };
  }, []);

  const handleSignInGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign in error:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.warn("Sign out note:", err);
    }
    clearStoredCustomer();
    setCurrentUser(null);
    setCustomerUser(null);
    setIsAdminOpen(false);
  };

  // Handle opening product & updating URL search param seamlessly
  const handleSelectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (product) {
          url.searchParams.set('product', product.id);
          window.history.pushState({ productId: product.id }, '', url.toString());
        } else {
          url.searchParams.delete('product');
          url.searchParams.delete('p');
          url.searchParams.delete('order');
          window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      }
    } catch (e) {
      console.warn("History push note:", e);
    }
  };

  // Deep linking: Open product or direct order on page load if product ID in URL
  useEffect(() => {
    if (products.length === 0) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get('product') || urlParams.get('p') || urlParams.get('item') ||
        (window.location.hash.startsWith('#product-') ? window.location.hash.replace('#product-', '') : null);
      const isDirectOrder = urlParams.get('order') === 'true' || urlParams.get('buy') === 'true';

      if (targetId) {
        const matched = products.find(p => String(p.id) === String(targetId));
        if (matched) {
          if (isDirectOrder) {
            setCartItems([{
              product: matched,
              quantity: 1,
              selectedSize: matched.sizes[0] || 'Standard',
              selectedColor: matched.colors[0] || 'Default',
              selectedImage: matched.image
            }]);
            setIsCheckoutOpen(true);
          } else {
            setSelectedProduct(matched);
          }
        }
      }

      // Listen for browser forward/back buttons
      const handlePopState = () => {
        const popParams = new URLSearchParams(window.location.search);
        const popId = popParams.get('product') || popParams.get('p');
        if (popId) {
          const popMatched = products.find(p => String(p.id) === String(popId));
          if (popMatched) setSelectedProduct(popMatched);
        } else {
          setSelectedProduct(null);
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    } catch (e) {
      console.warn("Deep linking parser note:", e);
    }
  }, [products]);

  // Unified active customer/user: Google user or Mobile Phone customer
  const activeCustomer: CustomerUser | null = currentUser ? {
    id: currentUser.uid,
    displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Customer',
    email: currentUser.email,
    phoneNumber: currentUser.phoneNumber,
    authProvider: 'google'
  } : customerUser;

  const isAdminUser = isEmailAdmin(activeCustomer?.email, adminEmails);

  const deletedCategoriesList = storeSettings?.deletedCategories || [];
  const customCategoriesList = storeSettings?.customCategories || ['Outerwear', 'Dresses', 'Knitwear', 'Skirts', 'Accessories', 'Traditional'];
  const categories = [
    'All',
    ...Array.from(new Set([
      ...customCategoriesList,
      ...products.map(p => p.category)
    ])).filter(cat => Boolean(cat) && !deletedCategoriesList.includes(cat))
  ];

  const handleAddToCart = (product: Product, size: string, color: string, qty = 1, selectedImage?: string) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(
        i => i.product.id === product.id && i.selectedSize === size && i.selectedColor === color
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += qty;
        if (selectedImage) {
          updated[existingIdx].selectedImage = selectedImage;
        }
        return updated;
      }
      return [...prev, { product, quantity: qty, selectedSize: size, selectedColor: color, selectedImage: selectedImage || product.image }];
    });
    setIsCartOpen(true);
  };

  // Instant direct order: skips cart and goes directly to checkout with this product
  const handleDirectCheckout = (product: Product, size: string, color: string, qty = 1, selectedImage?: string) => {
    setCartItems([{
      product,
      quantity: qty,
      selectedSize: size,
      selectedColor: color,
      selectedImage: selectedImage || product.image
    }]);
    setIsCheckoutOpen(true);
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    setCartItems(prev => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  // Filtered & sorted products
  const filteredProducts = (products || []).filter(p => {
    if (!p) return false;
    const title = (p.title || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();
    const q = (searchQuery || '').trim().toLowerCase();

    const matchesCat = selectedCategory === 'All' || cat === selectedCategory.toLowerCase();
    const matchesSearch = !q || title.includes(q) || desc.includes(q) || cat.includes(q);
    return matchesCat && matchesSearch;
  }).sort((a, b) => {
    const priceA = typeof a?.price === 'number' ? a.price : Number(a?.price) || 0;
    const priceB = typeof b?.price === 'number' ? b.price : Number(b?.price) || 0;
    if (sortBy === 'price-low') return priceA - priceB;
    if (sortBy === 'price-high') return priceB - priceA;
    return (b?.featured ? 1 : 0) - (a?.featured ? 1 : 0);
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] flex flex-col font-sans">
      
      {/* Navigation */}
      <Navbar
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenFirebaseGuide={() => setIsFirebaseGuideOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenInstallApp={() => setIsInstallAppOpen(true)}
        settings={storeSettings}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        currentUser={activeCustomer}
        isAdminUser={isAdminUser}
        onSignIn={() => setIsAuthModalOpen(true)}
        onSignInGoogle={handleSignInGoogle}
        onSignOut={handleSignOut}
      />

      {/* Hero / Banner Ads Carousel */}
      <Hero
        banners={banners}
        onShopClick={() => {
          const el = document.getElementById('product-grid');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onDownloadAppClick={() => setIsInstallAppOpen(true)}
        isAppDownloadEnabled={storeSettings?.isAppDownloadEnabled}
        appButtonText={storeSettings?.appButtonText || "Download apps"}
      />

      {/* Main Product Catalog Section */}
      <main id="product-grid" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-8">
        
        {/* Section Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E6E2DD] pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#C5A059] mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Curated Selection</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              {selectedCategory === 'All' ? 'The Complete Collection' : selectedCategory}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Category Pills (Mobile) */}
            <div className="flex overflow-x-auto gap-2 max-w-full pb-2 md:hidden">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#E6E2DD] text-[#1A1A1A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#888]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-[#E6E2DD] text-xs font-semibold text-[#1A1A1A] px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-1.5 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-xl h-48 sm:h-80 animate-pulse border border-[#E6E2DD]" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <h3 className="font-serif text-2xl font-bold text-[#1A1A1A]">No pieces found</h3>
            <p className="text-xs text-[#666]">Try adjusting your search terms or category filter.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="px-6 py-2.5 bg-[#1A1A1A] text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#C5A059]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-1.5 sm:gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={handleSelectProduct}
                onAddToCart={(p, s, c) => handleAddToCart(p, s, c, 1)}
                isWishlisted={wishlist.some(w => w.id === product.id)}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        )}
      </main>



      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6E2DD]">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#C5A059] fill-current" />
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Your Wishlist ({wishlist.length})</h3>
              </div>
              <button onClick={() => setIsWishlistOpen(false)} className="p-1.5 text-[#1A1A1A] hover:text-[#C5A059]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {wishlist.length === 0 ? (
                <div className="text-center py-16 text-[#888] text-xs">
                  Your wishlist is empty. Tap the heart icon on any product to save it here.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map(product => (
                    <div 
                      key={product.id} 
                      className="flex gap-3 p-3 bg-[#FAF9F6] rounded-xl border border-[#E6E2DD] cursor-pointer hover:border-[#C5A059] transition-all"
                      onClick={() => {
                        handleSelectProduct(product);
                        setIsWishlistOpen(false);
                      }}
                    >
                      <img src={product.image} alt={product.title} className="w-16 h-20 object-cover rounded-lg bg-white" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif text-sm font-bold text-[#1A1A1A] line-clamp-1">{product.title}</h4>
                          <div className="text-xs font-semibold text-[#C5A059]">
                            ৳{(typeof product.price === 'number' ? product.price : Number(product.price) || 0).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(
                              product,
                              (product.sizes && product.sizes[0]) || 'Free Size',
                              (product.colors && product.colors[0]) || 'Standard'
                            );
                            setIsWishlistOpen(false);
                          }}
                          className="w-full py-1.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-colors"
                        >
                          Add to Bag
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => handleSelectProduct(null)}
          onAddToCart={handleAddToCart}
          onDirectCheckout={handleDirectCheckout}
          isWishlisted={wishlist.some(w => w.id === selectedProduct.id)}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          onProceedCheckout={() => setIsCheckoutOpen(true)}
        />
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setCartItems([]);
          }}
          cartItems={cartItems}
          storeSettings={storeSettings}
          currentUser={activeCustomer}
          onCustomerAuthSuccess={(cust) => setCustomerUser(cust)}
          onSignOutCustomer={handleSignOut}
          onOrderSuccess={(order) => {
            setOrders(prev => [order, ...prev]);
          }}
        />
      )}

      {/* Customer Auth Modal (Gmail or Mobile Phone) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(cust) => {
          setCustomerUser(cust);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Admin Dashboard */}
      {isAdminOpen && (
        <AdminDashboard
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          products={products}
          banners={banners}
          orders={orders}
          storeSettings={storeSettings}
          onUpdateStoreSettings={(newSettings) => setStoreSettings(newSettings)}
          onUpdateBanners={(newBanners) => setBanners(newBanners)}
          onDeleteProduct={(prodId) => setProducts(prev => prev.filter(p => p.id !== prodId))}
          onDeleteOrder={(orderId) => setOrders(prev => prev.filter(o => o.id !== orderId))}
          onRefreshData={fetchData}
          onOpenFirebaseGuide={() => setIsFirebaseGuideOpen(true)}
          currentUser={currentUser}
          isAdminUser={isAdminUser}
          onSignInGoogle={handleSignInGoogle}
          onSignOut={handleSignOut}
          adminEmails={adminEmails}
          onUpdateAdminEmails={async (updated) => {
            await saveAdminEmails(updated);
            setAdminEmails(updated);
          }}
          adConfig={adConfig}
          onUpdateAdConfig={(newConfig) => setAdConfig(newConfig)}
        />
      )}

      {/* Firebase Setup Guide Modal */}
      {isFirebaseGuideOpen && (
        <FirebaseGuideModal
          isOpen={isFirebaseGuideOpen}
          onClose={() => setIsFirebaseGuideOpen(false)}
        />
      )}

      {/* Order Tracking Modal */}
      {isTrackingOpen && (
        <OrderTrackingModal
          isOpen={isTrackingOpen}
          onClose={() => setIsTrackingOpen(false)}
          orders={orders}
        />
      )}

      {/* Download Apps / Custom App File Download Modal */}
      {isInstallAppOpen && (
        <InstallAppModal
          isOpen={isInstallAppOpen}
          onClose={() => setIsInstallAppOpen(false)}
          settings={storeSettings}
        />
      )}

      {/* Floating WhatsApp and Facebook Social Buttons */}
      <FloatingSocialButtons
        whatsappNumber={storeSettings?.whatsappNumber}
        facebookUrl={storeSettings?.facebookUrl}
      />

      {/* Website Ad Manager (Popunder & 160x300 Banner scripts) */}
      <AdManager
        config={adConfig}
        isAdminOpen={isAdminOpen}
      />

      {/* Footer */}
      <Footer onOpenTracking={() => setIsTrackingOpen(true)} />

    </div>
  );
}
