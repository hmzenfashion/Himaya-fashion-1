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
import { Product, Order, BannerAd, StoreSettings } from './types';
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
    handleFirestoreError(error, OperationType.LIST, 'products');
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
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach(docSnap => {
        items.push({ ...docSnap.data(), id: docSnap.id } as Product);
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
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
    return items;
  } catch (error) {
    console.warn("fetchProductsFromFirestore warning:", error);
    return [];
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Firestore CRUD for Orders ---

export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'orders';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Order[] = [];
      snapshot.forEach(docSnap => {
        items.push({ ...docSnap.data(), id: docSnap.id } as Order);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function fetchOrdersFromFirestore(): Promise<Order[]> {
  const path = 'orders';
  try {
    const snap = await getDocs(collection(db, path));
    const items: Order[] = [];
    snap.forEach(docSnap => {
      items.push({ ...docSnap.data(), id: docSnap.id } as Order);
    });
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (error) {
    console.warn("fetchOrdersFromFirestore warning:", error);
    return [];
  }
}

export async function createOrderInFirestore(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: Order['status'], reason?: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const updateData: Partial<Order> = { status };
    if (reason !== undefined) updateData.cancelledReason = reason;
    await updateDoc(doc(db, 'orders', orderId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderTrackingInFirestore(
  orderId: string, 
  trackingData: { courierName?: string; trackingNumber?: string; trackingUrl?: string; trackingNotes?: string }
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), trackingData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function hideOrderFromAdminInFirestore(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), { deletedByAdmin: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function restoreOrderToAdminInFirestore(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), { deletedByAdmin: false });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Firestore CRUD for Banners ---

export function subscribeToBanners(
  onUpdate: (banners: BannerAd[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'banners';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: BannerAd[] = [];
      snapshot.forEach(docSnap => {
        items.push({ ...docSnap.data(), id: docSnap.id } as BannerAd);
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function fetchBannersFromFirestore(): Promise<BannerAd[]> {
  const path = 'banners';
  try {
    const snap = await getDocs(collection(db, path));
    const items: BannerAd[] = [];
    snap.forEach(docSnap => {
      items.push({ ...docSnap.data(), id: docSnap.id } as BannerAd);
    });
    return items;
  } catch (error) {
    console.warn("fetchBannersFromFirestore warning:", error);
    return [];
  }
}

export async function createBannerInFirestore(banner: BannerAd): Promise<void> {
  const path = `banners/${banner.id}`;
  try {
    await setDoc(doc(db, 'banners', banner.id), banner);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBannerInFirestore(bannerOrId: string | BannerAd, bannerData?: Partial<BannerAd>): Promise<void> {
  const bannerId = typeof bannerOrId === 'string' ? bannerOrId : bannerOrId.id;
  const data = typeof bannerOrId === 'string' ? (bannerData || {}) : bannerOrId;
  const path = `banners/${bannerId}`;
  try {
    await setDoc(doc(db, 'banners', bannerId), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBannerFromFirestore(bannerId: string): Promise<void> {
  const path = `banners/${bannerId}`;
  try {
    await deleteDoc(doc(db, 'banners', bannerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Firestore CRUD for Store Settings (bKash, Nagad, etc.) ---

export function subscribeToStoreSettings(
  onUpdate: (settings: StoreSettings) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'settings', 'store_configuration'),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as StoreSettings);
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
      return docSnap.data();
    }
  } catch (err) {
    console.warn("Error fetching store settings from Firestore:", err);
  }
  return null;
}

export async function saveStoreSettings(settings: any): Promise<void> {
  const path = 'settings/store_configuration';
  try {
    await setDoc(doc(db, 'settings', 'store_configuration'), {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
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
        return combined;
      }
    }
  } catch (err) {
    console.warn("Using default admin emails:", err);
  }
  return DEFAULT_ADMIN_EMAILS;
}

export async function saveAdminEmails(emails: string[]): Promise<void> {
  try {
    const cleanList = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...emails.map(e => e.toLowerCase().trim())]));
    await setDoc(doc(db, 'settings', 'admin_permissions'), {
      emails: cleanList,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to save admin emails:", err);
    throw err;
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

export async function registerCustomerWithEmail(name: string, email: string, pass: string): Promise<CustomerUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || cleanEmail.split('@')[0];
  const cleanPass = pass.trim();
  const customerId = `cust_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

  const customer: CustomerUser = {
    id: customerId,
    displayName: cleanName,
    email: cleanEmail,
    phoneNumber: null,
    authProvider: 'email'
  };

  try {
    await setDoc(doc(db, 'customers', customerId), {
      id: customer.id,
      name: cleanName,
      email: cleanEmail,
      password: cleanPass,
      authProvider: 'email',
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Could not save registered customer to Firestore:", err);
  }

  saveStoredCustomer(customer);
  return customer;
}

export async function loginCustomerWithEmail(email: string, pass: string): Promise<CustomerUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();
  const customerId = `cust_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

  let customerName = cleanEmail.split('@')[0];

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
        email: cleanEmail,
        password: cleanPass,
        authProvider: 'email',
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
    email: cleanEmail,
    phoneNumber: null,
    authProvider: 'email'
  };

  saveStoredCustomer(customer);
  await saveCustomerToFirestore(customer);
  return customer;
}



