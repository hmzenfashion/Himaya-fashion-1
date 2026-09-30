import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Product, Order, BannerAd, StoreSettings, AdConfiguration } from './types';
import { initialBanners, initialProducts } from './data/initialData';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Silence internal SDK debug transport messages (WebChannel reconnects, etc.)
try {
  setLogLevel('silent');
} catch {
  // ignore
}

// CRITICAL: Initialize Firestore with experimentalForceLongPolling and optimal timeout to prevent WebSocket / WebChannel transport errors in iframe sandbox
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalLongPollingOptions: {
    timeoutSeconds: 20
  }
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Authorized Admin Emails - Primary admin is mhemal136@gmail.com
export const DEFAULT_ADMIN_EMAILS = ['mhemal136@gmail.com'];

// Helper to identify and reject any demo/sample products
export function isDemoProduct(product: any): boolean {
  if (!product) return true;
  const id = String(product.id || '').trim();
  const title = String(product.title || '').trim().toLowerCase();

  // Explicit demo product IDs
  if (['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6'].includes(id)) return true;
  if (id.startsWith('prod-georgette-')) return true;
  if (id.startsWith('himaya-prod-')) return true;

  // Explicit demo product titles
  const demoSubstrings = [
    'elysian cashmere',
    'serenade silk',
    'milano tailored',
    'aurum pleated',
    'vanguard ribbed',
    'sovereign leather',
    'royal crimson jamdani',
    'emerald silk katan',
    'zardozi bridal lehenga',
    'classic executive men',
    'luxury velvet three-piece',
    'premium georgette three-piece (প্রিমিয়াম জর্জেট থ্রি-পিস - ১)',
    'designer georgette party three-piece (ডিজাইনার জর্জেট থ্রি-পিস - ২)',
    'embroidered georgette salwar kameez (স্টোন ওয়ার্ক জর্জেট থ্রি-পিস - ৩)',
    'হিমায়া এক্সক্লুসিভ জর্জেট থ্রি-পিস কালেকশন',
    'রয়েল ব্রাইডাল এমব্রয়ডারি জর্জেট থ্রি-পিস',
    'প্রিমিয়াম সিল্ক জামদানি শাড়ি কালেকশন',
    'ডিজাইনার পার্টি গাউন ও থ্রি-পিস'
  ];

  if (demoSubstrings.some(sub => title.includes(sub))) return true;

  return false;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// --- High-Speed Quota Circuit Breaker & Stale-While-Revalidate Engine ---
let isQuotaExceededMemory = false;
let quotaExceededTime = 0;
const QUOTA_COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes cooldown before trying remote read again
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL for public inventory/banners

export function isQuotaExhausted(): boolean {
  if (isQuotaExceededMemory) {
    if (Date.now() - quotaExceededTime < QUOTA_COOLDOWN_MS) {
      return true;
    }
    isQuotaExceededMemory = false;
    try { localStorage.removeItem('himaya_firestore_quota_exhausted'); } catch {}
  } else {
    try {
      const stored = localStorage.getItem('himaya_firestore_quota_exhausted');
      if (stored) {
        const time = Number(stored);
        if (Date.now() - time < QUOTA_COOLDOWN_MS) {
          isQuotaExceededMemory = true;
          quotaExceededTime = time;
          return true;
        } else {
          localStorage.removeItem('himaya_firestore_quota_exhausted');
        }
      }
    } catch {}
  }
  return false;
}

let hasLoggedQuotaNotice = false;

export function recordQuotaExceeded(err?: unknown): void {
  const errMsg = err instanceof Error ? err.message : String(err || '');
  const isQuota = errMsg.includes('quota') || 
                  errMsg.includes('resource-exhausted') || 
                  errMsg.includes('Quota exceeded') ||
                  errMsg.includes('RESOURCE_EXHAUSTED');
  
  if (isQuota || !err) {
    isQuotaExceededMemory = true;
    quotaExceededTime = Date.now();
    try {
      localStorage.setItem('himaya_firestore_quota_exhausted', String(Date.now()));
    } catch {}

    if (!hasLoggedQuotaNotice) {
      hasLoggedQuotaNotice = true;
      console.info(
        "%c[Firestore Free Tier Notice]%c Daily free read quota (50,000 reads/day) reached. Serving all live inventory, settings & banners from local high-speed cache & backend API. Database write operations remain active.",
        "background: #C5A059; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;",
        "color: #555; padding-left: 4px;"
      );
    }
  }
}

export function isCacheFresh(key: string): boolean {
  try {
    const ts = localStorage.getItem(`himaya_cache_ts_${key}`);
    if (ts && Date.now() - Number(ts) < CACHE_TTL_MS) {
      return true;
    }
  } catch {}
  return false;
}

export function markCacheFresh(key: string): void {
  try {
    localStorage.setItem(`himaya_cache_ts_${key}`, String(Date.now()));
  } catch {}
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (errMsg.includes('quota') || errMsg.includes('resource-exhausted') || errMsg.includes('Quota exceeded')) {
    recordQuotaExceeded(error);
  }
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  // Only log detailed errors if it's not a quota limit exhaustion
  if (!errMsg.includes('quota') && !errMsg.includes('resource-exhausted')) {
    console.error('Firestore Error:', JSON.stringify(errInfo));
  }
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot (Optimized: skips network hit if quota is exhausted or tested recently)
export async function testConnection(): Promise<boolean> {
  if (isQuotaExhausted()) return true;
  if (isCacheFresh('connection_test')) return true;

  try {
    await getDocFromServer(doc(db, 'settings', 'store_configuration'));
    markCacheFresh('connection_test');
    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes('quota') || errMsg.includes('resource-exhausted')) {
      recordQuotaExceeded(error);
      return true;
    }
    return false;
  }
}

// --- LocalStorage Caching & Quota Fallback Helpers ---
const STORAGE_KEYS = {
  PRODUCTS: 'himaya_real_products',
  ORDERS: 'himaya_real_orders',
  BANNERS: 'himaya_real_banners',
  SETTINGS: 'himaya_real_settings',
  ADMIN_EMAILS: 'himaya_real_admin_emails',
  AD_CONFIG: 'himaya_real_ad_config'
};

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = parsed.filter(p => !isDemoProduct(p));
        if (clean.length !== parsed.length) {
          saveStoredProducts(clean);
        }
        return clean;
      }
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export function getStoredCustomProducts(): Product[] {
  return getStoredProducts();
}

export function saveStoredCustomProducts(items: Product[]): void {
  saveStoredProducts(items);
}

export function saveStoredProducts(items: Product[]): void {
  try {
    const clean = (items || []).filter(p => !isDemoProduct(p));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(clean));
  } catch (e) {
    // ignore
  }
}

export async function fetchCouponsFromFirestore(): Promise<any[]> {
  const getFallbackCoupons = () => {
    try {
      const saved = localStorage.getItem('himaya_coupons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: '1', code: 'EID2026', discount: '20% OFF', minSpend: 1000, status: 'Active' },
      { id: '2', code: 'WELCOME10', discount: '10% OFF', minSpend: 500, status: 'Active' },
      { id: '3', code: 'FREESHIP', discount: 'Free Shipping', minSpend: 1500, status: 'Active' },
      { id: '4', code: 'HIMAYA100', discount: '৳100 OFF', minSpend: 800, status: 'Active' },
      { id: '5', code: 'BDSHOPVIP', discount: '৳250 OFF', minSpend: 2000, status: 'Active' },
    ];
  };

  if (isQuotaExhausted() || isCacheFresh('coupons')) {
    return getFallbackCoupons();
  }

  try {
    const snap = await getDocs(collection(db, 'coupons'));
    const items: any[] = [];
    snap.forEach(docSnap => {
      items.push({ ...docSnap.data(), id: docSnap.id });
    });
    if (items.length > 0) {
      markCacheFresh('coupons');
      try { localStorage.setItem('himaya_coupons', JSON.stringify(items)); } catch {}
      return items;
    }
  } catch (err) {
    recordQuotaExceeded(err);
  }
  return getFallbackCoupons();
}

export function subscribeToCoupons(onUpdate: (coupons: any[]) => void): Unsubscribe {
  // Always supply local/fallback coupons immediately
  try {
    const saved = localStorage.getItem('himaya_coupons');
    if (saved) onUpdate(JSON.parse(saved));
  } catch {}

  if (isQuotaExhausted()) return () => {};

  try {
    return onSnapshot(
      collection(db, 'coupons'),
      (snapshot) => {
        const items: any[] = [];
        snapshot.forEach(docSnap => {
          items.push({ ...docSnap.data(), id: docSnap.id });
        });
        if (items.length > 0) {
          markCacheFresh('coupons');
          try { localStorage.setItem('himaya_coupons', JSON.stringify(items)); } catch {}
          onUpdate(items);
        }
      },
      (err) => {
        recordQuotaExceeded(err);
      }
    );
  } catch (err) {
    recordQuotaExceeded(err);
    return () => {};
  }
}

export async function saveCouponToFirestore(coupon: any): Promise<void> {
  try {
    const couponId = String(coupon.id || coupon.code).trim();
    await setDoc(doc(db, 'coupons', couponId), coupon, { merge: true });
  } catch (err) {
    recordQuotaExceeded(err);
  }
}

export async function deleteCouponFromFirestore(couponId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'coupons', couponId));
  } catch (err) {
    recordQuotaExceeded(err);
  }
}

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export function saveStoredOrders(items: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(items));
  } catch (e) {
    // ignore
  }
}

export function getStoredBanners(): BannerAd[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BANNERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return initialBanners;
}

export function saveStoredBanners(items: BannerAd[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(items));
  } catch (e) {
    // ignore
  }
}

// --- Firestore CRUD for Products ---

export async function seedProductsIfEmpty(): Promise<void> {
  // Disabled demo seeding to strictly protect user's real products.
}

export async function seedBannersIfEmpty(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'banners'));
    if (snap.empty) {
      for (const banner of initialBanners) {
        await setDoc(doc(db, 'banners', banner.id), banner);
      }
    }
  } catch (error) {
    console.warn("Could not seed banners:", error);
  }
}

export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const localProds = getStoredProducts().filter(p => !isDemoProduct(p));
  if (localProds.length > 0) {
    onUpdate(localProds);
  }

  const path = 'products';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items: Product[] = [];
        snapshot.forEach(docSnap => {
          const p = { ...docSnap.data(), id: docSnap.id } as Product;
          if (!isDemoProduct(p)) {
            items.push(p);
          }
        });

        items.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id.match(/^prod-(\d+)/)?.[1] ? Number(a.id.match(/^prod-(\d+)/)![1]) : 0);
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id.match(/^prod-(\d+)/)?.[1] ? Number(b.id.match(/^prod-(\d+)/)![1]) : 0);
          return timeB - timeA;
        });

        saveStoredProducts(items);
        markCacheFresh('products');
        onUpdate(items);
      },
      (error) => {
        console.warn("Firestore products snapshot note:", error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn("Firestore products subscribe error:", err);
    return () => {};
  }
}

export async function fetchProductsFromFirestore(): Promise<Product[]> {
  const path = 'products';
  try {
    const snap = await getDocs(collection(db, path));
    const items: Product[] = [];
    snap.forEach(docSnap => {
      const p = { ...docSnap.data(), id: docSnap.id } as Product;
      if (!isDemoProduct(p)) {
        items.push(p);
      }
    });

    items.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id.match(/^prod-(\d+)/)?.[1] ? Number(a.id.match(/^prod-(\d+)/)![1]) : 0);
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id.match(/^prod-(\d+)/)?.[1] ? Number(b.id.match(/^prod-(\d+)/)![1]) : 0);
      return timeB - timeA;
    });

    saveStoredProducts(items);
    markCacheFresh('products');
    return items;
  } catch (error) {
    console.warn("Firestore fetchProductsFromFirestore:", error);
  }
  return getStoredProducts().filter(p => !isDemoProduct(p));
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  if (isDemoProduct(product)) return;
  const current = getStoredProducts().filter(p => !isDemoProduct(p));
  const idx = current.findIndex(p => p.id === product.id);
  let updated: Product[];
  if (idx > -1) {
    updated = [...current];
    updated[idx] = product;
  } else {
    updated = [product, ...current];
  }
  saveStoredProducts(updated);

  try {
    await setDoc(doc(db, 'products', product.id), product);
    markCacheFresh('products');
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const current = getStoredProducts();
  const updated = current.filter(p => p.id !== productId);
  saveStoredProducts(updated);

  try {
    await deleteDoc(doc(db, 'products', productId));
    markCacheFresh('products');
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

// --- Firestore CRUD for Orders ---

export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const localOrders = getStoredOrders();
  onUpdate(localOrders);

  if (isQuotaExhausted()) return () => {};

  const path = 'orders';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items: Order[] = [];
        snapshot.forEach(docSnap => {
          items.push({ ...docSnap.data(), id: docSnap.id } as Order);
        });
        if (items.length > 0) {
          const currentLocal = getStoredOrders();
          const remoteIds = new Set(items.map(o => o.id));
          const localOnly = currentLocal.filter(o => !remoteIds.has(o.id));
          const combined = [...items, ...localOnly];

          combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          saveStoredOrders(combined);
          markCacheFresh('orders');
          onUpdate(combined);
        }
      },
      (error) => {
        recordQuotaExceeded(error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    recordQuotaExceeded(err);
    return () => {};
  }
}

export async function fetchOrdersFromFirestore(): Promise<Order[]> {
  const local = getStoredOrders();
  if (isQuotaExhausted() || (isCacheFresh('orders') && local.length > 0)) {
    return local;
  }

  try {
    const snap = await getDocs(collection(db, 'orders'));
    const items: Order[] = [];
    snap.forEach(docSnap => {
      items.push({ ...docSnap.data(), id: docSnap.id } as Order);
    });
    if (items.length > 0) {
      const remoteIds = new Set(items.map(o => o.id));
      const localOnly = local.filter(o => !remoteIds.has(o.id));
      const combined = [...items, ...localOnly];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveStoredOrders(combined);
      markCacheFresh('orders');
      return combined;
    }
  } catch (error) {
    recordQuotaExceeded(error);
  }
  return local;
}

export async function createOrderInFirestore(order: Order): Promise<void> {
  const current = getStoredOrders();
  const updated = [order, ...current];
  saveStoredOrders(updated);

  try {
    await setDoc(doc(db, 'orders', order.id), order);
    markCacheFresh('orders');
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: Order['status'], reason?: string): Promise<void> {
  const current = getStoredOrders();
  const updated = current.map(o => o.id === orderId ? { ...o, status, ...(reason !== undefined ? { cancelledReason: reason } : {}) } : o);
  saveStoredOrders(updated);

  try {
    const updateData: Partial<Order> = { status };
    if (reason !== undefined) updateData.cancelledReason = reason;
    await updateDoc(doc(db, 'orders', orderId), updateData);
    markCacheFresh('orders');
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

export async function updateOrderTrackingInFirestore(
  orderId: string, 
  trackingData: { courierName?: string; trackingNumber?: string; trackingUrl?: string; trackingNotes?: string }
): Promise<void> {
  const current = getStoredOrders();
  const updated = current.map(o => o.id === orderId ? { ...o, ...trackingData } : o);
  saveStoredOrders(updated);

  try {
    await updateDoc(doc(db, 'orders', orderId), trackingData);
    markCacheFresh('orders');
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

export async function hideOrderFromAdminInFirestore(orderId: string): Promise<void> {
  const current = getStoredOrders();
  const updated = current.map(o => o.id === orderId ? { ...o, deletedByAdmin: true } : o);
  saveStoredOrders(updated);

  try {
    await updateDoc(doc(db, 'orders', orderId), { deletedByAdmin: true });
    markCacheFresh('orders');
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

export async function restoreOrderToAdminInFirestore(orderId: string): Promise<void> {
  const current = getStoredOrders();
  const updated = current.map(o => o.id === orderId ? { ...o, deletedByAdmin: false } : o);
  saveStoredOrders(updated);

  try {
    await updateDoc(doc(db, 'orders', orderId), { deletedByAdmin: false });
    markCacheFresh('orders');
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const current = getStoredOrders();
  const updated = current.filter(o => o.id !== orderId);
  saveStoredOrders(updated);

  try {
    await deleteDoc(doc(db, 'orders', orderId));
    markCacheFresh('orders');
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

// --- Firestore CRUD for Banners ---

export function subscribeToBanners(
  onUpdate: (banners: BannerAd[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  onUpdate(getStoredBanners());

  if (isQuotaExhausted()) return () => {};

  const path = 'banners';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items: BannerAd[] = [];
        snapshot.forEach(docSnap => {
          items.push({ ...docSnap.data(), id: docSnap.id } as BannerAd);
        });
        if (items.length > 0) {
          saveStoredBanners(items);
          markCacheFresh('banners');
          onUpdate(items);
        }
      },
      (error) => {
        recordQuotaExceeded(error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    recordQuotaExceeded(err);
    return () => {};
  }
}

export async function fetchBannersFromFirestore(): Promise<BannerAd[]> {
  const local = getStoredBanners();
  if (isQuotaExhausted() || (isCacheFresh('banners') && local.length > 0)) {
    return local;
  }

  try {
    const snap = await getDocs(collection(db, 'banners'));
    const items: BannerAd[] = [];
    snap.forEach(docSnap => {
      items.push({ ...docSnap.data(), id: docSnap.id } as BannerAd);
    });
    if (items.length > 0) {
      saveStoredBanners(items);
      markCacheFresh('banners');
      return items;
    }
  } catch (error) {
    recordQuotaExceeded(error);
  }
  return local;
}

export async function createBannerInFirestore(banner: BannerAd): Promise<void> {
  const current = getStoredBanners();
  saveStoredBanners([banner, ...current]);

  try {
    await setDoc(doc(db, 'banners', banner.id), banner);
    markCacheFresh('banners');
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

export async function updateBannerInFirestore(bannerOrId: string | BannerAd, bannerData?: Partial<BannerAd>): Promise<void> {
  const bannerId = typeof bannerOrId === 'string' ? bannerOrId : bannerOrId.id;
  const data = typeof bannerOrId === 'string' ? (bannerData || {}) : bannerOrId;
  
  const current = getStoredBanners();
  const updated = current.map(b => b.id === bannerId ? { ...b, ...data } : b);
  saveStoredBanners(updated);

  try {
    await setDoc(doc(db, 'banners', bannerId), data, { merge: true });
    markCacheFresh('banners');
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

export async function deleteBannerFromFirestore(bannerId: string): Promise<void> {
  const current = getStoredBanners();
  saveStoredBanners(current.filter(b => b.id !== bannerId));

  try {
    await deleteDoc(doc(db, 'banners', bannerId));
    markCacheFresh('banners');
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

// --- Firestore CRUD for Store Settings (bKash, Nagad, etc.) ---

export function subscribeToStoreSettings(
  onUpdate: (settings: StoreSettings) => void
): Unsubscribe {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) onUpdate(JSON.parse(raw));
  } catch (e) {
    // ignore
  }

  if (isQuotaExhausted()) return () => {};

  try {
    return onSnapshot(
      doc(db, 'settings', 'store_configuration'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StoreSettings;
          try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
            markCacheFresh('settings');
          } catch {
            // ignore
          }
          onUpdate(data);
        }
      },
      (error) => {
        recordQuotaExceeded(error);
      }
    );
  } catch (err) {
    recordQuotaExceeded(err);
    return () => {};
  }
}

export async function fetchStoreSettings(): Promise<any> {
  const getLocalSettings = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };

  if (isQuotaExhausted() || isCacheFresh('settings')) {
    const local = getLocalSettings();
    if (local) return local;
  }

  try {
    const docRef = doc(db, 'settings', 'store_configuration');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
        markCacheFresh('settings');
      } catch {
        // ignore
      }
      return data;
    }
  } catch (err) {
    recordQuotaExceeded(err);
  }
  return getLocalSettings();
}

export async function saveStoreSettings(settings: any): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    markCacheFresh('settings');
  } catch {
    // ignore
  }

  try {
    await setDoc(doc(db, 'settings', 'store_configuration'), {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

// --- Firestore CRUD for Ad Management (Popunder, Direct Link, Script banners) ---

export function subscribeToAdConfig(
  onUpdate: (config: AdConfiguration) => void
): Unsubscribe {
  try {
    const raw = localStorage.getItem('himaya_ad_config');
    if (raw) onUpdate(JSON.parse(raw));
  } catch {}

  if (isQuotaExhausted()) return () => {};

  try {
    return onSnapshot(
      doc(db, 'settings', 'ad_configuration'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as AdConfiguration;
          try {
            localStorage.setItem('himaya_ad_config', JSON.stringify(data));
            markCacheFresh('ad_config');
          } catch {}
          onUpdate(data);
        }
      },
      (error) => {
        recordQuotaExceeded(error);
      }
    );
  } catch (err) {
    recordQuotaExceeded(err);
    return () => {};
  }
}

export async function fetchAdConfig(): Promise<AdConfiguration | null> {
  const getLocal = () => {
    try {
      const raw = localStorage.getItem('himaya_ad_config');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };

  if (isQuotaExhausted() || isCacheFresh('ad_config')) {
    const local = getLocal();
    if (local) return local;
  }

  try {
    const docRef = doc(db, 'settings', 'ad_configuration');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AdConfiguration;
      try {
        localStorage.setItem('himaya_ad_config', JSON.stringify(data));
        markCacheFresh('ad_config');
      } catch {}
      return data;
    }
  } catch (err) {
    recordQuotaExceeded(err);
  }
  return getLocal();
}

export async function saveAdConfig(config: AdConfiguration): Promise<void> {
  try {
    localStorage.setItem('himaya_ad_config', JSON.stringify(config));
    markCacheFresh('ad_config');
  } catch {
    // ignore
  }

  try {
    await setDoc(doc(db, 'settings', 'ad_configuration'), {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    recordQuotaExceeded(error);
  }
}

// --- Google Authentication & Admin Permissions ---

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-in error:", error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// Fetch configured admin emails from Firestore or fallback to default
export async function fetchAdminEmails(): Promise<string[]> {
  const getLocalEmails = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_EMAILS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ADMIN_EMAILS;
  };

  if (isQuotaExhausted() || isCacheFresh('admin_emails')) {
    return getLocalEmails();
  }

  try {
    const docRef = doc(db, 'settings', 'admin_permissions');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && Array.isArray(data.emails) && data.emails.length > 0) {
        const combined = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...data.emails.map((e: string) => e.toLowerCase().trim())]));
        try {
          localStorage.setItem(STORAGE_KEYS.ADMIN_EMAILS, JSON.stringify(combined));
          markCacheFresh('admin_emails');
        } catch {}
        return combined;
      }
    }
  } catch (err) {
    recordQuotaExceeded(err);
  }
  return getLocalEmails();
}

export async function saveAdminEmails(emails: string[]): Promise<void> {
  const cleanList = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...emails.map(e => e.toLowerCase().trim())]));
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_EMAILS, JSON.stringify(cleanList));
    markCacheFresh('admin_emails');
  } catch {}

  try {
    await setDoc(doc(db, 'settings', 'admin_permissions'), {
      emails: cleanList,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    recordQuotaExceeded(err);
  }
}

export function isEmailAdmin(email: string | null | undefined, adminList: string[] = DEFAULT_ADMIN_EMAILS): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return adminList.some(adminEmail => adminEmail.toLowerCase().trim() === normalized) ||
         normalized === 'mhemal136@gmail.com';
}

// --- Customer Authentication & Session Management (Google & Phone) ---

export const CUSTOMER_STORAGE_KEY = 'himaya_customer_session';

export interface CustomerUser {
  id: string;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  authProvider: 'google' | 'phone' | 'email';
}

export function getStoredCustomer(): CustomerUser | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveStoredCustomer(customer: CustomerUser): void {
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
  } catch {}
}

export function clearStoredCustomer(): void {
  try {
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  } catch {}
}

export async function saveCustomerToFirestore(customer: CustomerUser): Promise<void> {
  try {
    const safeId = customer.id.replace(/[^a-zA-Z0-9_\-]/g, '_');
    await setDoc(doc(db, 'customers', safeId), {
      id: customer.id,
      name: customer.displayName || 'Customer',
      email: customer.email || '',
      phone: customer.phoneNumber || '',
      authProvider: customer.authProvider,
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    recordQuotaExceeded(err);
  }
}

export async function registerCustomerWithEmail(name: string, emailOrPhone: string, pass: string): Promise<CustomerUser> {
  const cleanId = emailOrPhone.trim().toLowerCase();
  const isEmail = cleanId.includes('@');
  const cleanName = name.trim() || (isEmail ? cleanId.split('@')[0] : cleanId);
  const cleanPass = pass.trim();
  const customerId = `cust_${cleanId.replace(/[^a-z0-9]/g, '_')}`;

  const customer: CustomerUser = {
    id: customerId,
    displayName: cleanName,
    email: isEmail ? cleanId : null,
    phoneNumber: !isEmail ? cleanId : null,
    authProvider: isEmail ? 'email' : 'phone'
  };

  try {
    await setDoc(doc(db, 'customers', customerId), {
      id: customer.id,
      name: cleanName,
      email: isEmail ? cleanId : '',
      phone: !isEmail ? cleanId : '',
      password: cleanPass,
      authProvider: isEmail ? 'email' : 'phone',
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    recordQuotaExceeded(err);
  }

  saveStoredCustomer(customer);
  return customer;
}

export async function loginCustomerWithEmail(emailOrPhone: string, pass: string): Promise<CustomerUser> {
  const cleanId = emailOrPhone.trim().toLowerCase();
  const isEmail = cleanId.includes('@');
  const cleanPass = pass.trim();
  const customerId = `cust_${cleanId.replace(/[^a-z0-9]/g, '_')}`;

  let customerName = isEmail ? cleanId.split('@')[0] : cleanId;

  try {
    const docRef = doc(db, 'customers', customerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.password && data.password !== cleanPass) {
        throw new Error("ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।");
      }
      if (data.name) customerName = data.name;
    } else {
      // If customer document doesn't exist yet, register them on the fly
      await setDoc(docRef, {
        id: customerId,
        name: customerName,
        email: isEmail ? cleanId : '',
        phone: !isEmail ? cleanId : '',
        password: cleanPass,
        authProvider: isEmail ? 'email' : 'phone',
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err: any) {
    if (err.message && err.message.includes("ভুল পাসওয়ার্ড")) {
      throw err;
    }
    recordQuotaExceeded(err);
  }

  const customer: CustomerUser = {
    id: customerId,
    displayName: customerName,
    email: isEmail ? cleanId : null,
    phoneNumber: !isEmail ? cleanId : null,
    authProvider: isEmail ? 'email' : 'phone'
  };

  saveStoredCustomer(customer);
  await saveCustomerToFirestore(customer);
  return customer;
}

// --- Customer Reviews CRUD ---
export interface ProductReview {
  id: string;
  productId: string;
  author: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  userId?: string;
}

export function getStoredReviews(productId: string): ProductReview[] {
  try {
    const raw = localStorage.getItem(`himaya_reviews_${productId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveStoredReviews(productId: string, reviews: ProductReview[]): void {
  try {
    localStorage.setItem(`himaya_reviews_${productId}`, JSON.stringify(reviews));
  } catch {}
}

export async function fetchReviewsForProduct(productId: string): Promise<ProductReview[]> {
  const local = getStoredReviews(productId);
  if (isQuotaExhausted()) return local;

  try {
    const snap = await getDocs(collection(db, `products/${productId}/reviews`));
    const items: ProductReview[] = [];
    snap.forEach(docSnap => {
      items.push({ ...docSnap.data(), id: docSnap.id } as ProductReview);
    });
    if (items.length > 0) {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveStoredReviews(productId, items);
      return items;
    }
  } catch (err) {
    recordQuotaExceeded(err);
  }
  return local;
}

export function subscribeToReviews(productId: string, onUpdate: (reviews: ProductReview[]) => void): Unsubscribe {
  const local = getStoredReviews(productId);
  if (local.length > 0) onUpdate(local);

  if (isQuotaExhausted()) return () => {};

  try {
    return onSnapshot(
      collection(db, `products/${productId}/reviews`),
      (snapshot) => {
        const items: ProductReview[] = [];
        snapshot.forEach(docSnap => {
          items.push({ ...docSnap.data(), id: docSnap.id } as ProductReview);
        });
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        saveStoredReviews(productId, items);
        onUpdate(items);
      },
      (err) => {
        recordQuotaExceeded(err);
      }
    );
  } catch (err) {
    recordQuotaExceeded(err);
    return () => {};
  }
}

export async function saveReviewToFirestore(productId: string, reviewData: Omit<ProductReview, 'id' | 'createdAt' | 'productId'>): Promise<ProductReview> {
  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newReview: ProductReview = {
    id: reviewId,
    productId,
    author: reviewData.author || 'Customer',
    rating: Number(reviewData.rating) || 5,
    comment: reviewData.comment || '',
    createdAt: new Date().toISOString(),
    userId: reviewData.userId || ''
  };

  const current = getStoredReviews(productId);
  const updated = [newReview, ...current];
  saveStoredReviews(productId, updated);

  try {
    await setDoc(doc(db, `products/${productId}/reviews`, reviewId), newReview);
  } catch (err) {
    recordQuotaExceeded(err);
  }
  return newReview;
}



