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
  getFirestore,
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
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Product, Order, BannerAd, StoreSettings, AdConfiguration } from './types';
import { initialProducts, initialBanners } from './data/initialData';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must provide firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Authorized Admin Emails - Primary admin is mhemal136@gmail.com
export const DEFAULT_ADMIN_EMAILS = ['mhemal136@gmail.com'];

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Firestore connected successfully!");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: client is offline.");
    } else {
      console.log("Firebase connection ping completed.");
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
      if (Array.isArray(parsed) && parsed.length >= 6) {
        // Ensure initialProducts are included if not present
        const existingIds = new Set(parsed.map(p => p.id));
        const missingInitial = initialProducts.filter(p => !existingIds.has(p.id));
        return [...missingInitial, ...parsed];
      }
    }
  } catch (e) {
    // ignore
  }
  return initialProducts;
}

export function getStoredCustomProducts(): Product[] {
  return getStoredProducts();
}

export function saveStoredCustomProducts(items: Product[]): void {
  saveStoredProducts(items);
}

export function saveStoredProducts(items: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(items));
  } catch (e) {
    // ignore
  }
}

export async function fetchCouponsFromFirestore(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'coupons'));
    const items: any[] = [];
    snap.forEach(docSnap => {
      items.push({ ...docSnap.data(), id: docSnap.id });
    });
    return items;
  } catch {
    return [];
  }
}

export function subscribeToCoupons(onUpdate: (coupons: any[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'coupons'),
    (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(docSnap => {
        items.push({ ...docSnap.data(), id: docSnap.id });
      });
      onUpdate(items);
    },
    () => {}
  );
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

// Automatically test connection when module loads
testConnection();

// --- Firestore CRUD for Products ---

export async function seedProductsIfEmpty(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty) {
      console.log("Seeding initial products to Firebase Firestore...");
      for (const prod of initialProducts) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
      console.log("Firestore products seeded successfully!");
    }
  } catch (error) {
    console.warn("Seed products note (quota or offline): Using local cache.");
  }
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
  // Immediately provide cached local products
  const localProds = getStoredProducts();
  onUpdate(localProds);

  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach(docSnap => {
        items.push({ ...docSnap.data(), id: docSnap.id } as Product);
      });
      if (items.length > 0) {
        // Merge with any local-only products not yet in remote
        const currentLocal = getStoredProducts();
        const remoteIds = new Set(items.map(p => p.id));
        const localOnly = currentLocal.filter(p => !remoteIds.has(p.id));
        const combined = [...items, ...localOnly];

        combined.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id.match(/^prod-(\d+)/)?.[1] ? Number(a.id.match(/^prod-(\d+)/)![1]) : 0);
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id.match(/^prod-(\d+)/)?.[1] ? Number(b.id.match(/^prod-(\d+)/)![1]) : 0);
          return timeB - timeA;
        });
        saveStoredProducts(combined);
        onUpdate(combined);
      }
    },
    (error) => {
      console.warn("Firestore product listener note (quota limit / offline): using local cache.");
      if (onError) onError(error);
    }
  );
}

export async function fetchProductsFromFirestore(): Promise<Product[]> {
  const path = 'products';
  try {
    const snap = await getDocs(collection(db, path));
    const items: Product[] = [];
    snap.forEach(docSnap => {
      items.push({ ...docSnap.data(), id: docSnap.id } as Product);
    });
    if (items.length > 0) {
      const currentLocal = getStoredProducts();
      const remoteIds = new Set(items.map(p => p.id));
      const localOnly = currentLocal.filter(p => !remoteIds.has(p.id));
      const combined = [...items, ...localOnly];

      combined.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id.match(/^prod-(\d+)/)?.[1] ? Number(a.id.match(/^prod-(\d+)/)![1]) : 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id.match(/^prod-(\d+)/)?.[1] ? Number(b.id.match(/^prod-(\d+)/)![1]) : 0);
        return timeB - timeA;
      });
      saveStoredProducts(combined);
      return combined;
    }
  } catch (error) {
    console.warn("fetchProductsFromFirestore quota/offline notice: falling back to local products.");
  }
  return getStoredProducts();
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  // Always update local cache first so user's real product is instantly saved regardless of Firestore quota
  const current = getStoredProducts();
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
  } catch (error) {
    console.warn("Cloud save warning (quota exceeded): saved locally successfully.", error);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  // Always update local cache first
  const current = getStoredProducts();
  const updated = current.filter(p => p.id !== productId);
  saveStoredProducts(updated);

  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    console.warn("Cloud delete warning (quota exceeded): deleted locally.", error);
  }
}

// --- Firestore CRUD for Orders ---

export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const localOrders = getStoredOrders();
  onUpdate(localOrders);

  const path = 'orders';
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
        onUpdate(combined);
      }
    },
    (error) => {
      console.warn("Orders subscription note:", error);
      if (onError) onError(error);
    }
  );
}

export async function fetchOrdersFromFirestore(): Promise<Order[]> {
  try {
    const snap = await getDocs(collection(db, 'orders'));
    const items: Order[] = [];
    snap.forEach(docSnap => {
      items.push({ ...docSnap.data(), id: docSnap.id } as Order);
    });
    if (items.length > 0) {
      const currentLocal = getStoredOrders();
      const remoteIds = new Set(items.map(o => o.id));
      const localOnly = currentLocal.filter(o => !remoteIds.has(o.id));
      const combined = [...items, ...localOnly];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveStoredOrders(combined);
      return combined;
    }
  } catch (error) {
    console.warn("fetchOrdersFromFirestore note: using local orders.");
  }
  return getStoredOrders();
}

export async function createOrderInFirestore(order: Order): Promise<void> {
  const current = getStoredOrders();
  const updated = [order, ...current];
  saveStoredOrders(updated);

  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (error) {
    console.warn("Create order cloud warning (quota exceeded): saved locally.", error);
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
  } catch (error) {
    console.warn("Update order status cloud warning:", error);
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
  } catch (error) {
    console.warn("Update tracking cloud warning:", error);
  }
}

export async function hideOrderFromAdminInFirestore(orderId: string): Promise<void> {
  const current = getStoredOrders();
  const updated = current.map(o => o.id === orderId ? { ...o, deletedByAdmin: true } : o);
  saveStoredOrders(updated);

  try {
    await updateDoc(doc(db, 'orders', orderId), { deletedByAdmin: true });
  } catch (error) {
    console.warn("Hide order cloud warning:", error);
  }
}

export async function restoreOrderToAdminInFirestore(orderId: string): Promise<void> {
  const current = getStoredOrders();
  const updated = current.map(o => o.id === orderId ? { ...o, deletedByAdmin: false } : o);
  saveStoredOrders(updated);

  try {
    await updateDoc(doc(db, 'orders', orderId), { deletedByAdmin: false });
  } catch (error) {
    console.warn("Restore order cloud warning:", error);
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const current = getStoredOrders();
  const updated = current.filter(o => o.id !== orderId);
  saveStoredOrders(updated);

  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    console.warn("Delete order cloud warning:", error);
  }
}

// --- Firestore CRUD for Banners ---

export function subscribeToBanners(
  onUpdate: (banners: BannerAd[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  onUpdate(getStoredBanners());

  const path = 'banners';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: BannerAd[] = [];
      snapshot.forEach(docSnap => {
        items.push({ ...docSnap.data(), id: docSnap.id } as BannerAd);
      });
      if (items.length > 0) {
        saveStoredBanners(items);
        onUpdate(items);
      }
    },
    (error) => {
      console.warn("Banners subscription note:", error);
      if (onError) onError(error);
    }
  );
}

export async function fetchBannersFromFirestore(): Promise<BannerAd[]> {
  try {
    const snap = await getDocs(collection(db, 'banners'));
    const items: BannerAd[] = [];
    snap.forEach(docSnap => {
      items.push({ ...docSnap.data(), id: docSnap.id } as BannerAd);
    });
    if (items.length > 0) {
      saveStoredBanners(items);
      return items;
    }
  } catch (error) {
    console.warn("fetchBannersFromFirestore note: using local banners.");
  }
  return getStoredBanners();
}

export async function createBannerInFirestore(banner: BannerAd): Promise<void> {
  const current = getStoredBanners();
  saveStoredBanners([banner, ...current]);

  try {
    await setDoc(doc(db, 'banners', banner.id), banner);
  } catch (error) {
    console.warn("Create banner cloud warning:", error);
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
  } catch (error) {
    console.warn("Update banner cloud warning:", error);
  }
}

export async function deleteBannerFromFirestore(bannerId: string): Promise<void> {
  const current = getStoredBanners();
  saveStoredBanners(current.filter(b => b.id !== bannerId));

  try {
    await deleteDoc(doc(db, 'banners', bannerId));
  } catch (error) {
    console.warn("Delete banner cloud warning:", error);
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

  return onSnapshot(
    doc(db, 'settings', 'store_configuration'),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as StoreSettings;
        try {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
        } catch {
          // ignore
        }
        onUpdate(data);
      }
    },
    (error) => {
      console.warn("Store settings snapshot note:", error);
    }
  );
}

export async function fetchStoreSettings(): Promise<any> {
  try {
    const docRef = doc(db, 'settings', 'store_configuration');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
      } catch {
        // ignore
      }
      return data;
    }
  } catch (err) {
    console.warn("Error fetching store settings from Firestore: using local cache.");
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

export async function saveStoreSettings(settings: any): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }

  try {
    await setDoc(doc(db, 'settings', 'store_configuration'), {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn("Save store settings cloud warning:", error);
  }
}

// --- Firestore CRUD for Ad Management (Popunder, Direct Link, Script banners) ---

export function subscribeToAdConfig(
  onUpdate: (config: AdConfiguration) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'settings', 'ad_configuration'),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as AdConfiguration);
      }
    },
    (error) => {
      console.warn("Ad config snapshot note:", error);
    }
  );
}

export async function fetchAdConfig(): Promise<AdConfiguration | null> {
  try {
    const docRef = doc(db, 'settings', 'ad_configuration');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AdConfiguration;
    }
  } catch (err) {
    console.warn("Error fetching ad configuration from Firestore:", err);
  }
  return null;
}

export async function saveAdConfig(config: AdConfiguration): Promise<void> {
  try {
    localStorage.setItem('himaya_ad_config', JSON.stringify(config));
  } catch {
    // ignore
  }

  try {
    await setDoc(doc(db, 'settings', 'ad_configuration'), {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn("Save ad config cloud warning:", error);
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
  try {
    const docRef = doc(db, 'settings', 'admin_permissions');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && Array.isArray(data.emails) && data.emails.length > 0) {
        const combined = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...data.emails.map((e: string) => e.toLowerCase().trim())]));
        try {
          localStorage.setItem(STORAGE_KEYS.ADMIN_EMAILS, JSON.stringify(combined));
        } catch {
          // ignore
        }
        return combined;
      }
    }
  } catch (err) {
    console.warn("Using default or cached admin emails due to quota/offline.");
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_EMAILS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_ADMIN_EMAILS;
}

export async function saveAdminEmails(emails: string[]): Promise<void> {
  const cleanList = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...emails.map(e => e.toLowerCase().trim())]));
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_EMAILS, JSON.stringify(cleanList));
  } catch {
    // ignore
  }

  try {
    await setDoc(doc(db, 'settings', 'admin_permissions'), {
      emails: cleanList,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Save admin emails cloud warning:", err);
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
  } catch (e) {
    console.warn("Could not read customer from storage", e);
  }
  return null;
}

export function saveStoredCustomer(customer: CustomerUser): void {
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
  } catch (e) {
    console.warn("Could not save customer to storage", e);
  }
}

export function clearStoredCustomer(): void {
  try {
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  } catch (e) {
    console.warn("Could not clear customer storage", e);
  }
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
    console.warn("Could not save customer to Firestore:", err);
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
    console.warn("Could not save registered customer to Firestore:", err);
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
    console.warn("Firestore customer login check warning:", err);
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



