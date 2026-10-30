import express from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import * as archiver from "archiver";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ extended: true, limit: '150mb' }));
app.use(express.raw({ limit: '150mb', type: 'application/octet-stream' }));

// Data file path
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  images?: string[];
  description: string;
  badge?: string;
  sizes: string[];
  colors: string[];
  stock: number;
  featured?: boolean;
  isPinned?: boolean;
  isPopular?: boolean;
  createdAt?: string;
}

interface BannerAd {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  linkText: string;
  active: boolean;
  tag: string;
}

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image?: string;
}

interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  division?: string;
  district?: string;
  thana?: string;
  address: string;
  city: string;
  deliveryArea?: 'Inside Dhaka' | 'Outside Dhaka';
  deliveryCharge?: number;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  trackingNotes?: string;
  paymentMethod?: string;
  paymentSenderPhone?: string;
  paymentTrxId?: string;
  customerId?: string;
  customerAuthType?: 'google' | 'phone' | 'email';
  deletedByAdmin?: boolean;
  cancelledReason?: string;
  isFirstOrder?: boolean;
  couponCode?: string;
  discountAmount?: number;
}

interface StoreSettings {
  bkashNumber: string;
  bkashType: 'Personal' | 'Merchant' | 'Agent';
  nagadNumber: string;
  nagadType: 'Personal' | 'Merchant';
  rocketNumber?: string;
  paymentInstructions?: string;
  contactPhone?: string;
  promoNotice?: string;
  isPromoActive?: boolean;
  deliveryChargeInsideDhaka?: number;
  deliveryChargeOutsideDhaka?: number;
  appApkUrl?: string;
  appApkVersion?: string;
  appApkSize?: string;
  appDownloadNotes?: string;
  appButtonText?: string;
  isAppDownloadEnabled?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  isTelegramNotificationsEnabled?: boolean;
}

export interface CouponItem {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  displayDiscount: string;
  discount?: string;
  offerTitle?: string;
  minSpend: number;
  status: 'Active' | 'Expired';
  isHidden?: boolean;
  singleUse?: boolean;
  deleteOnUse?: boolean;
  createdAt?: string;
}

interface StoreData {
  products: Product[];
  banners: BannerAd[];
  orders: Order[];
  coupons?: CouponItem[];
  settings?: StoreSettings;
  adConfig?: any;
  version: string;
}

const defaultAdConfig = {
  globalAdsEnabled: true,
  popunderCooldownMinutes: 1,
  ads: [
    {
      id: "adsterra-popunder",
      name: "Adsterra Popunder / Direct Smartlink",
      type: "popunder",
      enabled: true,
      linkUrl: "https://www.profitableratecpmnetwork.com/peqj1c1g?key=22bd9ad3eec7103becba033d685cb45f",
      placement: "popunder",
      createdAt: "2026-03-01T00:00:00.000Z"
    },
    {
      id: "adsterra-banner-160x300",
      name: "Adsterra 160x300 Iframe Banner",
      type: "script_banner",
      enabled: true,
      scriptCode: `<script type="text/javascript">\n  atOptions = {\n    'key' : 'c4ae09df70d272d84914d3233703d9dd',\n    'format' : 'iframe',\n    'height' : 300,\n    'width' : 160,\n    'params' : {}\n  };\n</script>\n<script type="text/javascript" src="https://www.highrevenueformat.com/c4ae09df70d272d84914d3233703d9dd/invoke.js"></script>`,
      placement: "floating_corner",
      createdAt: "2026-03-01T00:00:00.000Z"
    }
  ],
  updatedAt: "2026-03-01T00:00:00.000Z"
};

const defaultSettings: StoreSettings = {
  bkashNumber: "01712-345678",
  bkashType: "Personal",
  nagadNumber: "01912-345678",
  nagadType: "Personal",
  rocketNumber: "",
  paymentInstructions: "বিকাশ বা নগদ অ্যাপ থেকে সেন্ড মানি অথবা পেমেন্ট করুন এবং নিচে আপনার প্রেরক মোবাইল নম্বর ও TrxID লিখে অর্ডার কনফার্ম করুন।",
  contactPhone: "+880 1712-345678",
  promoNotice: "✨ Spring Luxury 2026 Collection — Enjoy Express Delivery across Bangladesh",
  isPromoActive: true,
  deliveryChargeInsideDhaka: 80,
  deliveryChargeOutsideDhaka: 150,
  appApkUrl: "/uploads/himaya-fashion.apk",
  appApkVersion: "v1.2.0",
  appApkSize: "16.8 MB",
  appDownloadNotes: "Official Himaya Fashion Android App. Instant shopping, push order updates & exclusive member offers.",
  appButtonText: "Download apps",
  isAppDownloadEnabled: true,
  telegramBotToken: "9051474160:AAEC6TImfbG8vjZUbYePEuKRWIAb6IyVahI",
  telegramChatId: "6333005937",
  isTelegramNotificationsEnabled: true
};

const initialData: StoreData = {
  version: "v1.4.2",
  settings: defaultSettings,
  banners: [
    {
      id: "b1",
      title: "Autumn-Winter Couture '26",
      subtitle: "Experience unmatched warmth and sophisticated tailoring crafted for the modern icon.",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200",
      linkText: "Explore Collection",
      active: true,
      tag: "Limited Release"
    },
    {
      id: "b2",
      title: "The Silk & Cashmere Edit",
      subtitle: "Handpicked Italian and Mongolian fibers designed to drape flawlessly on every occasion.",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1200",
      linkText: "Shop Luxury",
      active: true,
      tag: "Signature Series"
    }
  ],
  products: [],
  orders: []
};

// Ensure data and uploads files/dirs exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(process.cwd(), "public")));

// Direct APK download routes
app.get(['/himaya-fashion.apk', '/api/download-apk', '/download-apk'], (req, res) => {
  const rootApk = path.join(process.cwd(), "himaya-fashion.apk");
  const publicApk = path.join(process.cwd(), "public", "himaya-fashion.apk");
  const target = fs.existsSync(rootApk) ? rootApk : publicApk;

  if (fs.existsSync(target)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="himaya-fashion.apk"');
    return res.sendFile(target);
  }
  return res.status(404).send("APK file not found");
});

function getStoreData(): StoreData {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return initialData;
  }
}

function saveStoreData(data: StoreData) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Routes
// Upload endpoint for photos selected from gallery or camera
app.post("/api/upload", (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: "No image data provided" });
    }

    const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (matches) {
      let ext = matches[1].toLowerCase();
      if (ext.includes('jpeg')) ext = 'jpg';
      else if (ext.includes('png')) ext = 'png';
      else if (ext.includes('webp')) ext = 'webp';
      else ext = 'jpg';

      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filepath, buffer);
      return res.json({ success: true, url: `/uploads/${filename}` });
    } else {
      // Direct URL already
      return res.json({ success: true, url: image });
    }
  } catch (err: any) {
    console.error("Gallery image upload error:", err);
    res.status(500).json({ error: err.message || "Failed to save gallery image" });
  }
});

// Direct App / APK File Upload endpoint from Admin Panel (allows admin to upload any file of their choice)
app.post(["/api/upload-app-file", "/api/upload-apk"], (req, res) => {
  try {
    let buffer: Buffer | null = null;
    let fileName = '';

    // If global raw body parser parsed it as a Buffer
    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      buffer = req.body;
      const rawHeaderName = req.headers['x-file-name'] ? decodeURIComponent(req.headers['x-file-name'] as string) : '';
      fileName = rawHeaderName || 'himaya_app.apk';
    } else if (req.body && typeof req.body === 'object') {
      // If global json parser parsed it as an object (base64 JSON fallback)
      const { fileData, fileName: bodyName } = req.body;
      if (fileData && typeof fileData === 'string') {
        const cleanBase64 = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
        buffer = Buffer.from(cleanBase64, 'base64');
        fileName = bodyName || 'himaya_app.apk';
      }
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: "No file data received" });
    }
    
    // Extract original extension or fallback to .apk
    let originalExt = '.apk';
    if (fileName && fileName.includes('.')) {
      originalExt = '.' + fileName.split('.').pop()?.toLowerCase();
    }

    const baseName = fileName ? fileName.substring(0, fileName.lastIndexOf('.')).replace(/[^a-zA-Z0-9_\-]/g, '_') : 'app_file';
    const targetFileName = `${baseName || 'himaya_app'}_${Date.now()}${originalExt}`;
    const targetFilePath = path.join(UPLOADS_DIR, targetFileName);
    fs.writeFileSync(targetFilePath, buffer);

    const sizeInMB = (buffer.length / (1024 * 1024)).toFixed(1) + " MB";
    const appUrl = `/uploads/${targetFileName}`;

    // Update settings in memory and file
    const data = getStoreData();
    if (data.settings) {
      data.settings.appApkUrl = appUrl;
      data.settings.appApkSize = sizeInMB;
      data.settings.isAppDownloadEnabled = true;
      saveStoreData(data);
    }

    return res.json({
      success: true,
      url: appUrl,
      fileName: targetFileName,
      originalName: fileName || targetFileName,
      size: sizeInMB
    });
  } catch (err: any) {
    console.error("App file upload error:", err);
    return res.status(500).json({ error: err.message || "Failed to upload file" });
  }
});

// Ensure a default app APK file exists for immediate download testing
try {
  const defaultApkPath = path.join(UPLOADS_DIR, "himaya-fashion.apk");
  if (!fs.existsSync(defaultApkPath)) {
    fs.writeFileSync(defaultApkPath, Buffer.from("PK\x03\x04HimayaFashionAndroidOfficialAppBuildPackage2026"));
  }
} catch (e) {
  console.warn("Could not create default sample apk:", e);
}

app.get("/api/products", (req, res) => {
  const data = getStoreData();
  res.json(data.products);
});

app.post("/api/products", (req, res) => {
  const data = getStoreData();
  const newProduct: Product = {
    id: req.body.id || ("prod-" + Date.now()),
    title: req.body.title || "Untitled Product",
    price: Number(req.body.price) || 0,
    originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : undefined,
    category: req.body.category || "General",
    image: req.body.image || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800",
    images: Array.isArray(req.body.images) ? req.body.images : (req.body.image ? [req.body.image] : []),
    description: req.body.description || "",
    badge: req.body.badge || "",
    sizes: req.body.sizes || ["S", "M", "L"],
    colors: req.body.colors || ["Black", "White"],
    stock: Number(req.body.stock) || 10,
    featured: Boolean(req.body.featured),
    isPinned: Boolean(req.body.isPinned),
    isPopular: Boolean(req.body.isPopular || req.body.isPinned),
    createdAt: req.body.createdAt || new Date().toISOString()
  };
  data.products.unshift(newProduct);
  saveStoreData(data);
  res.json({ success: true, product: newProduct });
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const data = getStoreData();
  const idx = data.products.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Product not found" });
  }
  data.products[idx] = {
    ...data.products[idx],
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : data.products[idx].price,
    originalPrice: req.body.originalPrice !== undefined ? (req.body.originalPrice ? Number(req.body.originalPrice) : undefined) : data.products[idx].originalPrice,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : data.products[idx].stock,
    images: Array.isArray(req.body.images) ? req.body.images : data.products[idx].images,
    isPinned: req.body.isPinned !== undefined ? Boolean(req.body.isPinned) : data.products[idx].isPinned,
    isPopular: req.body.isPopular !== undefined ? Boolean(req.body.isPopular) : (req.body.isPinned !== undefined ? Boolean(req.body.isPinned) : data.products[idx].isPopular),
    createdAt: data.products[idx].createdAt || req.body.createdAt || new Date().toISOString()
  };
  saveStoreData(data);
  res.json({ success: true, product: data.products[idx] });
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const data = getStoreData();
  const initialLength = data.products.length;
  data.products = data.products.filter(p => p.id !== id);
  if (data.products.length === initialLength) {
    return res.status(404).json({ error: "Product not found" });
  }
  saveStoreData(data);
  res.json({ success: true, message: "Product deleted" });
});

// Banners API
app.get("/api/banners", (req, res) => {
  const data = getStoreData();
  res.json(data.banners);
});

app.post("/api/banners", (req, res) => {
  const data = getStoreData();
  const newBanner: BannerAd = {
    id: req.body.id || ("b-" + Date.now()),
    title: req.body.title || "New Collection",
    subtitle: req.body.subtitle || "",
    image: req.body.image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200",
    linkText: req.body.linkText || "Explore Collection",
    active: req.body.active !== undefined ? Boolean(req.body.active) : true,
    tag: req.body.tag || "Featured"
  };
  data.banners.push(newBanner);
  saveStoreData(data);
  res.json({ success: true, banner: newBanner });
});

app.put("/api/banners/:id", (req, res) => {
  const { id } = req.params;
  const data = getStoreData();
  const idx = data.banners.findIndex(b => b.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Banner not found" });
  }
  data.banners[idx] = {
    ...data.banners[idx],
    ...req.body
  };
  saveStoreData(data);
  res.json({ success: true, banner: data.banners[idx] });
});

app.delete("/api/banners/:id", (req, res) => {
  const { id } = req.params;
  const data = getStoreData();
  data.banners = data.banners.filter(b => b.id !== id);
  saveStoreData(data);
  res.json({ success: true, message: "Banner deleted" });
});

app.put("/api/banners", (req, res) => {
  const data = getStoreData();
  if (Array.isArray(req.body)) {
    data.banners = req.body;
  } else if (req.body && req.body.banners) {
    data.banners = req.body.banners;
  }
  saveStoreData(data);
  res.json({ success: true, banners: data.banners });
});

// Coupons API
const defaultCouponsList: CouponItem[] = [
  { id: '1', code: 'EID2026', discountType: 'percentage', discountValue: 20, displayDiscount: '20% OFF', discount: '20% OFF', offerTitle: 'ঈদ স্পেশাল ২০% ছাড় অফার', minSpend: 1000, status: 'Active' },
  { id: '2', code: 'WELCOME10', discountType: 'percentage', discountValue: 10, displayDiscount: '10% OFF', discount: '10% OFF', offerTitle: 'নতুন গ্রাহকদের জন্য ১০% ছাড়', minSpend: 500, status: 'Active' },
  { id: '3', code: 'FREESHIP', discountType: 'free_shipping', discountValue: 0, displayDiscount: 'Free Shipping', discount: 'Free Shipping', offerTitle: 'ফ্রি ডেলিভারি অফার (Free Shipping)', minSpend: 1500, status: 'Active' },
  { id: '4', code: 'SAVE150', discountType: 'fixed', discountValue: 150, displayDiscount: '৳150 OFF', discount: '৳150 OFF', offerTitle: 'ফ্ল্যাট ৳১৫০ ছাড়', minSpend: 1200, status: 'Active' },
];

app.get("/api/coupons", (req, res) => {
  const data = getStoreData();
  if (data.coupons === undefined || data.coupons === null) {
    data.coupons = defaultCouponsList;
    saveStoreData(data);
  }
  res.json(data.coupons);
});

app.post("/api/coupons", (req, res) => {
  const data = getStoreData();
  if (Array.isArray(req.body)) {
    data.coupons = req.body;
  } else if (req.body && req.body.code) {
    if (!Array.isArray(data.coupons)) data.coupons = [];
    const discountType = req.body.discountType || 'percentage';
    const discountValue = Number(req.body.discountValue) || 10;
    const displayDiscount = req.body.displayDiscount || (discountType === 'percentage' ? `${discountValue}% OFF` : (discountType === 'fixed' ? `৳${discountValue} OFF` : 'Free Shipping'));
    const newCoupon: CouponItem = {
      id: req.body.id || ("coup-" + Date.now()),
      code: String(req.body.code).trim().toUpperCase(),
      discountType,
      discountValue,
      displayDiscount,
      discount: displayDiscount,
      offerTitle: req.body.offerTitle || displayDiscount,
      minSpend: Number(req.body.minSpend) || 0,
      status: req.body.status || 'Active',
      isHidden: Boolean(req.body.isHidden),
      singleUse: req.body.singleUse !== undefined ? Boolean(req.body.singleUse) : true,
      deleteOnUse: req.body.deleteOnUse !== undefined ? Boolean(req.body.deleteOnUse) : true,
      createdAt: req.body.createdAt || new Date().toISOString()
    };
    data.coupons = [newCoupon, ...data.coupons.filter(c => c.id !== newCoupon.id && c.code.toLowerCase() !== newCoupon.code.toLowerCase())];
  }
  saveStoreData(data);
  res.json({ success: true, coupons: data.coupons });
});

app.put("/api/coupons/:id", (req, res) => {
  const { id } = req.params;
  const data = getStoreData();
  if (!Array.isArray(data.coupons)) data.coupons = [];
  const idx = data.coupons.findIndex(c => c.id === id || c.code.toLowerCase() === id.toLowerCase());
  if (idx === -1) {
    return res.status(404).json({ error: "Coupon not found" });
  }
  data.coupons[idx] = {
    ...data.coupons[idx],
    ...req.body,
    code: req.body.code ? String(req.body.code).trim().toUpperCase() : data.coupons[idx].code,
    displayDiscount: req.body.displayDiscount || data.coupons[idx].displayDiscount,
    discount: req.body.displayDiscount || data.coupons[idx].displayDiscount,
    isHidden: req.body.isHidden !== undefined ? Boolean(req.body.isHidden) : data.coupons[idx].isHidden
  };
  saveStoreData(data);
  res.json({ success: true, coupon: data.coupons[idx], coupons: data.coupons });
});

app.delete("/api/coupons/:id", (req, res) => {
  const { id } = req.params;
  const data = getStoreData();
  if (!Array.isArray(data.coupons)) data.coupons = [];
  const targetId = String(id).toLowerCase();
  data.coupons = data.coupons.filter(c => String(c.id).toLowerCase() !== targetId && String(c.code).toLowerCase() !== targetId);
  saveStoreData(data);
  res.json({ success: true, coupons: data.coupons });
});

// Settings API (bKash, Nagad, announcements, delivery)
app.get("/api/settings", (req, res) => {
  const data = getStoreData();
  res.json(data.settings || defaultSettings);
});

app.put("/api/settings", (req, res) => {
  const data = getStoreData();
  data.settings = {
    ...(data.settings || defaultSettings),
    ...req.body
  };
  saveStoreData(data);
  res.json({ success: true, settings: data.settings });
});

// Advertising & Monetization API (Popunder, Banner scripts, Direct links)
app.get("/api/ads", (req, res) => {
  const data = getStoreData();
  res.json(data.adConfig || defaultAdConfig);
});

app.put("/api/ads", (req, res) => {
  const data = getStoreData();
  data.adConfig = {
    ...(data.adConfig || defaultAdConfig),
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  saveStoreData(data);
  res.json({ success: true, adConfig: data.adConfig });
});

// Admin Login
app.post("/api/admin/login", (req, res) => {
  const { pin } = req.body;
  if (pin === "1234" || pin === "himaya2026" || pin === "admin") {
    res.json({ success: true, token: "himaya_secure_token_" + Date.now() });
  } else {
    res.status(401).json({ success: false, error: "Invalid Admin PIN or password." });
  }
});

// Orders
app.get("/api/orders", (req, res) => {
  const data = getStoreData();
  res.json(data.orders);
});

app.post("/api/orders", (req, res) => {
  const data = getStoreData();
  const deliveryArea = req.body.deliveryArea === 'Outside Dhaka' ? 'Outside Dhaka' : 'Inside Dhaka';
  const deliveryCharge = req.body.deliveryCharge !== undefined 
    ? Number(req.body.deliveryCharge) 
    : (deliveryArea === 'Outside Dhaka' ? 150 : 80);

  const newOrder: Order = {
    id: req.body.id || ("ORD-" + Math.floor(100000 + Math.random() * 900000)),
    customerName: req.body.customerName || "Guest",
    email: req.body.email || "",
    phone: req.body.phone || "",
    division: req.body.division || "",
    district: req.body.district || "",
    thana: req.body.thana || "",
    address: req.body.address || "",
    city: req.body.city || "",
    deliveryArea: deliveryArea,
    deliveryCharge: deliveryCharge,
    items: req.body.items || [],
    totalAmount: Number(req.body.totalAmount) || 0,
    status: 'Pending',
    createdAt: req.body.createdAt || new Date().toISOString(),
    paymentMethod: req.body.paymentMethod || 'cod',
    paymentSenderPhone: req.body.paymentSenderPhone || '',
    paymentTrxId: req.body.paymentTrxId || '',
    customerId: req.body.customerId || '',
    customerAuthType: req.body.customerAuthType || undefined,
    isFirstOrder: req.body.isFirstOrder !== undefined ? Boolean(req.body.isFirstOrder) : false
  };
  data.orders.unshift(newOrder);
  saveStoreData(data);

  // Trigger real-time Telegram Bot notification in background
  sendTelegramOrderNotification(newOrder).catch(err => {
    console.warn("Background Telegram notification error:", err);
  });

  res.json({ success: true, order: newOrder });
});

function escapeTelegramHtml(unsafe?: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendTelegramOrderNotification(order: Order, customSettings?: StoreSettings) {
  try {
    const data = getStoreData();
    const settings = customSettings || data.settings || defaultSettings;
    const rawToken = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "9051474160:AAEC6TImfbG8vjZUbYePEuKRWIAb6IyVahI";
    const botToken = (rawToken || "").replace(/\s+/g, '').trim();
    const chatId = (settings.telegramChatId || process.env.TELEGRAM_CHAT_ID || "6333005937").trim();

    if (!botToken || !chatId) {
      console.log("ℹ️ Telegram bot token or chat ID is not set yet. Skipping Telegram alert.");
      return { success: false, reason: "Bot Token or Chat ID missing" };
    }

    if (settings.isTelegramNotificationsEnabled === false) {
      console.log("ℹ️ Telegram notifications are currently disabled in settings.");
      return { success: false, reason: "Notifications disabled in settings" };
    }

    const orderTime = new Date(order.createdAt || Date.now()).toLocaleString('bn-BD', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const isFirst = order.isFirstOrder ?? true;

    // Extract primary product picture
    let primaryImage = '';
    for (const item of (order.items || [])) {
      if (item.image && typeof item.image === 'string' && item.image.trim()) {
        primaryImage = item.image.trim();
        break;
      }
    }

    const itemsList = (order.items || []).map((item, idx) => {
      let t = `<b>${idx + 1}. ${escapeTelegramHtml(item.title)}</b>\n`;
      t += `   • সাইজ: <code>${escapeTelegramHtml(item.size || 'Free Size')}</code> | কালার: <code>${escapeTelegramHtml(item.color || 'Default')}</code>\n`;
      t += `   • পরিমাণ: <b>${item.quantity}টি</b> x ৳${item.price} = <b>৳${(item.price * item.quantity).toFixed(2)}</b>`;
      return t;
    }).join('\n');

    const paymentText = order.paymentMethod === 'bkash'
      ? `বিকাশ (bKash)${order.paymentTrxId ? ` | TrxID: <code>${escapeTelegramHtml(order.paymentTrxId)}</code> (প্রেরক: <code>${escapeTelegramHtml(order.paymentSenderPhone || '')}</code>)` : ''}`
      : order.paymentMethod === 'nagad'
      ? `নগদ (Nagad)${order.paymentTrxId ? ` | TrxID: <code>${escapeTelegramHtml(order.paymentTrxId)}</code> (প্রেরক: <code>${escapeTelegramHtml(order.paymentSenderPhone || '')}</code>)` : ''}`
      : 'ক্যাশ অন ডেলিভারি (Cash on Delivery)';

    const discountText = (order.discountAmount && order.discountAmount > 0)
      ? `🎟️ <b>কুপন ডিসকাউন্ট (${escapeTelegramHtml(order.couponCode || 'PROMO')}):</b> -৳${order.discountAmount.toFixed(2)}\n`
      : '';

    const itemsSubtotal = (order.totalAmount - (order.deliveryCharge || 0) + (order.discountAmount || 0));

    const headerHtml =
      `🛍️ <b>নতুন অর্ডার নোটিফিকেশন — হিমায়া ফ্যাশন</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 <b>অর্ডার আইডি:</b> <code>#${escapeTelegramHtml(order.id)}</code>\n` +
      `📅 <b>সময়:</b> ${orderTime}\n` +
      `${isFirst ? '⭐ <i>ওয়েবসাইটে গ্রাহকের প্রথম অর্ডার!</i>\n' : ''}` +
      `\n👤 <b>গ্রাহকের তথ্য:</b>\n` +
      `• নাম: <b>${escapeTelegramHtml(order.customerName)}</b>\n` +
      `• ফোন: <code>${escapeTelegramHtml(order.phone)}</code>\n` +
      (order.email ? `• ইমেইল: ${escapeTelegramHtml(order.email)}\n` : '') +
      `\n📍 <b>ডেলিভারি ঠিকানা:</b>\n` +
      `• ঠিকানা: ${escapeTelegramHtml(order.address)}\n` +
      `• এলাকা/উপজেলা: ${escapeTelegramHtml([order.thana, order.district].filter(Boolean).join(', ') || order.city || 'N/A')}\n` +
      `• ডেলিভারি জোন: ${escapeTelegramHtml(order.deliveryArea || 'Inside Dhaka')} (চার্জ: ৳${order.deliveryCharge || 80})\n` +
      `\n👗 <b>অর্ডারকৃত পণ্যসমূহ (${order.items?.length || 0}টি):</b>\n`;

    const footerHtml =
      `\n━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 <b>পেমেন্ট পদ্ধতি:</b> ${paymentText}\n` +
      `💰 <b>পণ্যের মূল্য:</b> ৳${itemsSubtotal.toFixed(2)}\n` +
      `${discountText}` +
      `🚚 <b>ডেলিভারি চার্জ:</b> ৳${(order.deliveryCharge || 0).toFixed(2)}\n` +
      `✨ <b>সর্বমোট প্রদেয় টাকা:</b> <b>৳${order.totalAmount.toFixed(2)}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💎 <b>হিমায়া ফ্যাশন (Himaya Fashion BD)</b>`;

    // Customer WhatsApp action buttons
    const rawPhone = (order.phone || '').replace(/[^0-9]/g, '');
    let waPhone = rawPhone;
    if (waPhone.startsWith('0')) waPhone = '88' + waPhone;
    else if (!waPhone.startsWith('880') && waPhone.length === 10) waPhone = '880' + waPhone;

    const inlineKeyboard: any[] = [];
    const buttonRow: any[] = [];
    if (waPhone) {
      buttonRow.push({
        text: '💬 হোয়াটসঅ্যাপে চ্যাট করুন',
        url: `https://wa.me/${waPhone}`
      });
    }
    buttonRow.push({
      text: '🌐 ওয়েবসাইট ভিজিট',
      url: 'https://himayafashion.netlify.app'
    });
    inlineKeyboard.push(buttonRow);
    const replyMarkup = { inline_keyboard: inlineKeyboard };

    const fullMessageHtml = `${headerHtml}${itemsList}${footerHtml}`;
    let captionHtml = fullMessageHtml;
    if (captionHtml.length > 1000) {
      const truncatedItems = (order.items || []).slice(0, 2).map((item, idx) => 
        `<b>${idx + 1}. ${escapeTelegramHtml(item.title)}</b> (${item.quantity}টি - ৳${item.price})`
      ).join('\n') + `\n<i>...এবং আরও ${(order.items || []).length - 2}টি পণ্য</i>`;
      captionHtml = `${headerHtml}${truncatedItems}${footerHtml}`;
      if (captionHtml.length > 1000) {
        captionHtml = captionHtml.substring(0, 995) + '...';
      }
    }

    // Resolve all ordered items with photos (base64 buffers, local files, or remote URLs)
    const items = order.items || [];
    const resolvedItems: Array<{
      title: string;
      size: string;
      color: string;
      quantity: number;
      price: number;
      image: string;
      blob: Blob | null;
      filename: string;
    }> = [];

    for (const it of items) {
      const rawImg = (it.image || '').trim();
      let blob: Blob | null = null;
      let filename = 'product.jpg';

      if (rawImg.startsWith('data:image/')) {
        try {
          const base64Data = rawImg.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          blob = new Blob([buffer], { type: 'image/jpeg' });
          filename = 'product_image.jpg';
        } catch {}
      } else if (!rawImg.startsWith('http://') && !rawImg.startsWith('https://')) {
        const candidatePaths = [
          path.join(process.cwd(), rawImg),
          path.join(process.cwd(), 'public', rawImg),
          path.join(UPLOADS_DIR, path.basename(rawImg)),
          path.join(DATA_DIR, rawImg)
        ];
        for (const p of candidatePaths) {
          if (fs.existsSync(p)) {
            try {
              const buffer = fs.readFileSync(p);
              blob = new Blob([buffer], { type: 'image/jpeg' });
              filename = path.basename(p);
              break;
            } catch {}
          }
        }
      }

      resolvedItems.push({
        title: it.title || 'Product',
        size: it.size || 'Free Size',
        color: it.color || 'Standard',
        quantity: it.quantity || 1,
        price: it.price || 0,
        image: rawImg,
        blob,
        filename
      });
    }

    const itemsWithPhotos = resolvedItems.filter(i => i.blob !== null || i.image.startsWith('http://') || i.image.startsWith('https://'));

    // ==========================================
    // CASE A: Customer ordered MULTIPLE items in bag (>1 item with photos)
    // ==========================================
    if (itemsWithPhotos.length > 1) {
      let albumSent = false;

      // Attempt 1: Grouped photo album (sendMediaGroup)
      try {
        const formData = new FormData();
        formData.append('chat_id', chatId);

        const mediaGroupPayload: any[] = [];
        const albumBatch = itemsWithPhotos.slice(0, 10);

        for (let idx = 0; idx < albumBatch.length; idx++) {
          const item = albumBatch[idx];
          const itemTotal = (item.price * item.quantity).toFixed(2);
          const caption = idx === 0
            ? `🛍️ <b>অর্ডার #${escapeTelegramHtml(order.id)} [পণ্য ১/${items.length}]</b>\n<b>${escapeTelegramHtml(item.title)}</b>\n• সাইজ: <code>${escapeTelegramHtml(item.size)}</code> | কালার: <code>${escapeTelegramHtml(item.color)}</code>\n• পরিমাণ: <b>${item.quantity}টি</b> x ৳${item.price} = <b>৳${itemTotal}</b>`
            : `👗 <b>[পণ্য ${idx + 1}/${items.length}] ${escapeTelegramHtml(item.title)}</b>\n• সাইজ: <code>${escapeTelegramHtml(item.size)}</code> | কালার: <code>${escapeTelegramHtml(item.color)}</code>\n• পরিমাণ: <b>${item.quantity}টি</b> x ৳${item.price} = <b>৳${itemTotal}</b>`;

          if (item.blob) {
            const attachName = `photo_${idx}`;
            formData.append(attachName, item.blob, item.filename || `product_${idx + 1}.jpg`);
            mediaGroupPayload.push({
              type: 'photo',
              media: `attach://${attachName}`,
              caption,
              parse_mode: 'HTML'
            });
          } else {
            mediaGroupPayload.push({
              type: 'photo',
              media: item.image,
              caption,
              parse_mode: 'HTML'
            });
          }
        }

        formData.append('media', JSON.stringify(mediaGroupPayload));

        const mediaRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
          method: 'POST',
          body: formData
        });
        const mediaData = await mediaRes.json().catch(() => null);

        if (mediaRes.ok && mediaData?.ok) {
          albumSent = true;
          console.log(`✅ [Backend] Telegram sendMediaGroup succeeded with ${albumBatch.length} item photos for order:`, order.id);
        } else if (mediaRes.status === 401 || mediaData?.error_code === 401) {
          console.warn("⚠️ [Backend Telegram] Token is unauthorized (401). Please update the Bot Token in Admin Dashboard > Telegram Bot from @BotFather.");
          return { success: false, error: "Telegram Bot Token is unauthorized (401). Please update in Admin Settings." };
        } else {
          console.warn("[Backend] Telegram sendMediaGroup note:", mediaData?.description || 'album not sent');
        }
      } catch (albumErr) {
        console.warn("[Backend] Telegram sendMediaGroup exception:", albumErr);
      }

      // Attempt 2: Sequential sendPhoto for each item if mediaGroup failed (only if not unauthorized)
      if (!albumSent) {
        for (let idx = 0; idx < itemsWithPhotos.length; idx++) {
          const item = itemsWithPhotos[idx];
          const itemTotal = (item.price * item.quantity).toFixed(2);
          const caption = `📦 <b>[পণ্য ${idx + 1}/${items.length}] ${escapeTelegramHtml(item.title)}</b>\n• সাইজ: <code>${escapeTelegramHtml(item.size)}</code> | কালার: <code>${escapeTelegramHtml(item.color)}</code>\n• পরিমাণ: <b>${item.quantity}টি</b> x ৳${item.price} = <b>৳${itemTotal}</b>`;

          try {
            if (item.blob) {
              const itemForm = new FormData();
              itemForm.append('chat_id', chatId);
              itemForm.append('caption', caption);
              itemForm.append('parse_mode', 'HTML');
              itemForm.append('photo', item.blob, item.filename || `product_${idx + 1}.jpg`);
              const pRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: 'POST',
                body: itemForm
              });
              if (pRes.status === 401) {
                console.warn("⚠️ [Backend Telegram] Token is unauthorized (401). Stopping photo dispatch.");
                return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
              }
            } else if (item.image) {
              const pRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  photo: item.image,
                  caption,
                  parse_mode: 'HTML'
                })
              });
              if (pRes.status === 401) {
                console.warn("⚠️ [Backend Telegram] Token is unauthorized (401). Stopping photo dispatch.");
                return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
              }
            }
          } catch (singleErr) {
            console.warn(`[Backend] Telegram sendPhoto for item ${idx + 1} note:`, singleErr);
          }
        }
      }

      // Now send the complete invoice message with WhatsApp button
      const invoiceRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: fullMessageHtml,
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        })
      });
      const invoiceData = await invoiceRes.json().catch(() => null);
      if (invoiceRes.ok && invoiceData?.ok) {
        return { success: true, withPhoto: true, result: invoiceData };
      }
      if (invoiceRes.status === 401 || invoiceData?.error_code === 401) {
        console.warn("⚠️ [Backend Telegram] Token is unauthorized (401). Please update in Admin Settings.");
        return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
      }
    }

    // ==========================================
    // CASE B: Single item with photo
    // ==========================================
    if (primaryImage) {
      try {
        const singleResolved = resolvedItems.find(i => i.blob !== null || i.image);
        if (singleResolved?.blob) {
          const formData = new FormData();
          formData.append('chat_id', chatId);
          formData.append('caption', captionHtml);
          formData.append('parse_mode', 'HTML');
          formData.append('reply_markup', JSON.stringify(replyMarkup));
          formData.append('photo', singleResolved.blob, singleResolved.filename || 'product_image.jpg');

          const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            body: formData
          });
          const photoData = await photoRes.json().catch(() => null);
          if (photoRes.ok && photoData?.ok) {
            console.log("✅ [Backend] Telegram order alert sent with image blob for order:", order.id);
            return { success: true, withPhoto: true, result: photoData };
          }
          if (photoRes.status === 401 || photoData?.error_code === 401) {
            console.warn("⚠️ [Backend Telegram] Token is unauthorized (401). Please update in Admin Settings.");
            return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
          }
        } else if (primaryImage.startsWith('http://') || primaryImage.startsWith('https://')) {
          const photoUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
          const photoRes = await fetch(photoUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              photo: primaryImage,
              caption: captionHtml,
              parse_mode: 'HTML',
              reply_markup: replyMarkup
            })
          });
          const photoData = await photoRes.json().catch(() => null);
          if (photoRes.ok && photoData?.ok) {
            console.log("✅ [Backend] Telegram order alert sent with remote image URL for order:", order.id);
            return { success: true, withPhoto: true, result: photoData };
          }
          if (photoRes.status === 401 || photoData?.error_code === 401) {
            console.warn("⚠️ [Backend Telegram] Token is unauthorized (401). Please update in Admin Settings.");
            return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
          }
        }
      } catch (singlePhotoErr) {
        console.warn("⚠️ [Backend] sendPhoto note:", singlePhotoErr);
      }
    }


    // Fallback: Send message as text
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: fullMessageHtml,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });

    const responseData = await response.json().catch(() => null);
    if (response.status === 401 || responseData?.error_code === 401) {
      console.warn("⚠️ [Backend Telegram] Token is unauthorized (401). Please update the Bot Token in Admin Settings.");
      return { success: false, error: "Telegram Bot Token is unauthorized (401)" };
    }
    if (!response.ok || !responseData?.ok) {
      console.warn("⚠️ Telegram API note:", responseData?.description);
      return { success: false, error: responseData?.description || 'Failed to send Telegram message' };
    }

    console.log("✅ Telegram order alert sent successfully for order:", order.id);
    return { success: true, withPhoto: false, result: responseData };
  } catch (err: any) {
    console.warn("Telegram notification note:", err?.message || err);
    return { success: false, error: err.message || 'Telegram notification failed' };
  }
}

// Telegram Manual Dispatch API
app.post("/api/notify-telegram", async (req, res) => {
  try {
    const order = req.body.order;
    if (!order) {
      return res.status(400).json({ error: "Order details required" });
    }
    const result = await sendTelegramOrderNotification(order);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to notify telegram" });
  }
});

// Telegram Test Alert API (Sends sample order with product photo)
app.post("/api/telegram/test", async (req, res) => {
  try {
    const { botToken, chatId } = req.body;
    const data = getStoreData();
    const rawToken = botToken || data.settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "9051474160:AAEC6TImfbG8vjZUbYePEuKRWIAb6IyVahI";
    const token = (rawToken || "").replace(/\s+/g, '').trim();
    const chat = (chatId || data.settings?.telegramChatId || process.env.TELEGRAM_CHAT_ID || "6333005937").trim();

    if (!token || !chat) {
      return res.status(400).json({
        success: false,
        error: "Bot Token এবং Chat ID দুটোই প্রয়োজন। অনুগ্রহ করে ফিল্ডগুলো পূরণ করুন।"
      });
    }

    const testOrder: Order = {
      id: "TEST-" + Math.floor(1000 + Math.random() * 9000),
      customerName: "পরীক্ষামূলক গ্রাহক (Test Customer)",
      email: "test@himayafashion.com",
      phone: "01832350726",
      division: "ঢাকা (Dhaka)",
      district: "ঢাকা (Dhaka)",
      thana: "ধানমন্ডি (Dhanmondi)",
      address: "বাড়ি #১২, রোড #৪, ধানমন্ডি, ঢাকা",
      city: "ধানমন্ডি, ঢাকা",
      deliveryArea: "Inside Dhaka",
      deliveryCharge: 80,
      items: [
        {
          id: "prod-sample-1",
          title: "রয়েল ব্রাইডাল এমব্রয়ডারি ড্রেস (Royal Bridal Embroidery)",
          price: 3150,
          quantity: 1,
          size: "XL",
          color: "Deep Crimson",
          image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"
        }
      ],
      totalAmount: 3230,
      status: "Pending",
      createdAt: new Date().toISOString(),
      paymentMethod: "bkash",
      paymentSenderPhone: "01832350726",
      paymentTrxId: "TRX" + Math.floor(100000 + Math.random() * 900000),
      isFirstOrder: true
    };

    const tempSettings: StoreSettings = {
      ...(data.settings || defaultSettings),
      telegramBotToken: token,
      telegramChatId: chat,
      isTelegramNotificationsEnabled: true
    };

    const result = await sendTelegramOrderNotification(testOrder, tempSettings);
    if (result.success) {
      return res.json({
        success: true,
        withPhoto: result.withPhoto,
        message: result.withPhoto
          ? "টেলিগ্রামে প্রোডাক্টের ছবিসহ টেস্ট অর্ডার নোটিফিকেশন সফলভাবে পাঠানো হয়েছে! আপনার টেলিগ্রাম চেক করুন।"
          : "টেলিগ্রামে টেস্ট অর্ডার নোটিফিকেশন সফলভাবে পাঠানো হয়েছে! আপনার টেলিগ্রাম চেক করুন।"
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || "টেলিগ্রামে মেসেজ পাঠানো যায়নি। দয়া করে Bot Token ও Chat ID ঠিক আছে কিনা যাচাই করুন।"
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "সার্ভার এরর"
    });
  }
});

app.put("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const data = getStoreData();
  const order = data.orders.find(o => o.id === id);
  if (order) {
    if (req.body.status) order.status = req.body.status;
    if (req.body.courierName !== undefined) order.courierName = req.body.courierName;
    if (req.body.trackingNumber !== undefined) order.trackingNumber = req.body.trackingNumber;
    if (req.body.trackingUrl !== undefined) order.trackingUrl = req.body.trackingUrl;
    if (req.body.trackingNotes !== undefined) order.trackingNotes = req.body.trackingNotes;
    if (req.body.deletedByAdmin !== undefined) order.deletedByAdmin = Boolean(req.body.deletedByAdmin);
    if (req.body.cancelledReason !== undefined) order.cancelledReason = req.body.cancelledReason;
    saveStoreData(data);
    res.json({ success: true, order });
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

app.delete("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const data = getStoreData();
  const orderIndex = data.orders.findIndex(o => o.id === id);
  if (orderIndex !== -1) {
    const order = data.orders[orderIndex];
    if (req.query.permanent === 'true' || order.deletedByAdmin) {
      data.orders = data.orders.filter(o => o.id !== id);
      saveStoreData(data);
      res.json({ success: true, message: "Order permanently deleted" });
    } else {
      // Safe admin soft-delete: hides from active admin view into removed tab
      order.deletedByAdmin = true;
      saveStoreData(data);
      res.json({ success: true, message: "Order hidden from admin panel safely" });
    }
  } else {
    // If not found in memory, return ok so UI does not break
    res.json({ success: true, message: "Order not found or already deleted" });
  }
});

// AI Assistant route to auto-parse raw product text
app.post("/api/gemini/parse-product", async (req, res) => {
  try {
    const { prompt, categories } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: "Product description text is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured in environment secrets." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const categoryListStr = Array.isArray(categories) && categories.length > 0
      ? categories.join(", ")
      : "Outerwear, Dresses, Knitwear, Skirts, Accessories, Traditional";

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Analyze the following raw product text/description for a boutique fashion store "Himaya Fashion" and extract structured product details:

Raw Product Text:
"""
${prompt}
"""

Available Categories in Store: [${categoryListStr}]

Instructions:
1. Extract or generate a clean, attractive Product Title ("title").
2. Choose the closest matching category from the Available Categories list for "category".
3. Extract or infer regular MRP / original price ("originalPrice") in BDT. If not stated, calculate a reasonable regular price (e.g., 20-30% higher than selling price).
4. Extract or infer selling price ("price") in BDT.
5. Create a detailed, stylish product description ("description") in English/Bangla emphasizing fabric quality, style, and occasion.
6. Extract stock quantity ("stock") as an integer (default 10 if not mentioned).
7. Extract available sizes ("sizes") as a comma-separated string (e.g. "S, M, L, XL" or "Unstitched" / "Free Size").
8. Extract available colors ("colors") as a comma-separated string (e.g. "Maroon, Gold, Black").
9. Suggest a short badge tag ("badge") like "New", "Hot", "Sale", "20% OFF", or "" if none.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            originalPrice: { type: Type.NUMBER },
            price: { type: Type.NUMBER },
            description: { type: Type.STRING },
            stock: { type: Type.INTEGER },
            sizes: { type: Type.STRING },
            colors: { type: Type.STRING },
            badge: { type: Type.STRING },
          },
          required: ["title", "category", "price", "description", "stock", "sizes", "colors"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      return res.status(500).json({ error: "Empty response from Gemini model" });
    }

    const parsedData = JSON.parse(textOutput);
    return res.json({ success: true, data: parsedData });
  } catch (err) {
    console.error("Gemini parse product error:", err);
    return res.status(500).json({
      error: "Failed to process text with Gemini AI",
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

// Version info & update check
app.get("/api/version", (req, res) => {
  const data = getStoreData();
  res.json({
    version: data.version,
    updateAvailable: false,
    latestVersion: data.version,
    changelog: "Latest stability release with real-time sync and Firebase storage connector instructions."
  });
});

// Export full source code package as ZIP
app.get("/api/export-source", (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="himaya-fashion-source-package.zip"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Create zip archive
    let archive: any;
    if (typeof (archiver as any).create === 'function') {
      archive = (archiver as any).create('zip', { zlib: { level: 9 } });
    } else if (typeof (archiver as any).ZipArchive === 'function') {
      archive = new (archiver as any).ZipArchive({ zlib: { level: 9 } });
    } else if (typeof (archiver as any).default === 'function') {
      archive = (archiver as any).default('zip', { zlib: { level: 9 } });
    } else {
      const rawFn: any = archiver;
      archive = rawFn('zip', { zlib: { level: 9 } });
    }

    archive.on('error', (err: unknown) => {
      console.error("Archive stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate source archive" });
      }
    });

    archive.on('warning', (err: unknown) => {
      console.warn("Archive warning:", err);
    });

    archive.pipe(res);

    archive.glob('**/*', {
      cwd: process.cwd(),
      dot: true,
      ignore: [
        'node_modules/**',
        '.git/**',
        '.env',
        '.env.*',
        '*.log',
        '.cache/**'
      ]
    });

    archive.finalize();
  } catch (err) {
    console.error("Export source error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export source package" });
    }
  }
});

// Export Netlify-ready package (only pre-built dist folder contents at root of zip)
app.get("/api/export-netlify", (req, res) => {
  try {
    const distPath = path.join(process.cwd(), "dist");
    if (!fs.existsSync(distPath) || !fs.existsSync(path.join(distPath, "index.html"))) {
      console.log("Dist folder missing, building on the fly...");
      try {
        execSync("npm run build", { stdio: "inherit" });
      } catch (buildErr) {
        console.error("Auto-build error during export-netlify:", buildErr);
      }
    }

    // Ensure _redirects is present in dist
    const redirectsSrc = path.join(process.cwd(), "_redirects");
    const redirectsDest = path.join(distPath, "_redirects");
    if (!fs.existsSync(redirectsDest)) {
      if (fs.existsSync(redirectsSrc)) {
        fs.copyFileSync(redirectsSrc, redirectsDest);
      } else {
        fs.writeFileSync(redirectsDest, "/*    /index.html   200\n");
      }
    }

    // Ensure netlify.toml is present in dist
    const tomlSrc = path.join(process.cwd(), "netlify.toml");
    const tomlDest = path.join(distPath, "netlify.toml");
    if (fs.existsSync(tomlSrc) && !fs.existsSync(tomlDest)) {
      try {
        fs.copyFileSync(tomlSrc, tomlDest);
      } catch (tomlErr) {
        console.warn("Could not copy netlify.toml:", tomlErr);
      }
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="himaya-fashion-netlify-ready.zip"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    let archive: any;
    if (typeof (archiver as any).create === 'function') {
      archive = (archiver as any).create('zip', { zlib: { level: 9 } });
    } else if (typeof (archiver as any).ZipArchive === 'function') {
      archive = new (archiver as any).ZipArchive({ zlib: { level: 9 } });
    } else if (typeof (archiver as any).default === 'function') {
      archive = (archiver as any).default('zip', { zlib: { level: 9 } });
    } else {
      const rawFn: any = archiver;
      archive = rawFn('zip', { zlib: { level: 9 } });
    }

    archive.on('error', (err: unknown) => {
      console.error("Netlify archive stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate Netlify archive" });
      }
    });

    archive.pipe(res);

    // Stream files from dist directory directly into root of archive
    archive.directory(distPath, false);

    archive.finalize();
  } catch (err) {
    console.error("Export Netlify error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export Netlify package" });
    }
  }
});

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Himaya Fashion Server running on http://localhost:${PORT}`);
  });
}

startServer();
