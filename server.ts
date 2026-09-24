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
  customerAuthType?: 'google' | 'phone';
  deletedByAdmin?: boolean;
  cancelledReason?: string;
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
}

interface StoreData {
  products: Product[];
  banners: BannerAd[];
  orders: Order[];
  settings?: StoreSettings;
  version: string;
}

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
  isAppDownloadEnabled: true
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
  products: [
    {
      id: "prod-1",
      title: "Elysian Cashmere Oversized Coat",
      price: 349.00,
      originalPrice: 420.00,
      category: "Outerwear",
      image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800",
      description: "Crafted from ethically sourced Mongolian cashmere. Features a structured lapel, deep welt pockets, and a relaxed silhouette that exudes effortless luxury.",
      badge: "Best Seller",
      sizes: ["XS", "S", "M", "L"],
      colors: ["Camel", "Charcoal", "Cream"],
      stock: 15,
      featured: true
    },
    {
      id: "prod-2",
      title: "Serenade Silk Midi Dress",
      price: 210.00,
      category: "Dresses",
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800",
      description: "A breathtaking slip dress tailored from pure mulberry silk. Delicate bias-cut draping hugs your silhouette with fluid grace.",
      badge: "New Arrival",
      sizes: ["S", "M", "L"],
      colors: ["Emerald", "Champagne", "Midnight Black"],
      stock: 8,
      featured: true
    },
    {
      id: "prod-3",
      title: "Milano Tailored Wool Blazer",
      price: 285.00,
      originalPrice: 330.00,
      category: "Outerwear",
      image: "https://images.unsplash.com/photo-1550639525-c97d455acf70?auto=format&fit=crop&q=80&w=800",
      description: "Sharp architectural tailoring meets relaxed everyday elegance. Horn buttons and dual back vents for immaculate poise.",
      badge: "Sale",
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Navy", "Pinstripe Grey", "Burgundy"],
      stock: 12,
      featured: true
    },
    {
      id: "prod-4",
      title: "Aurum Pleated Satin Skirt",
      price: 145.00,
      category: "Skirts",
      image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&q=80&w=800",
      description: "Dynamic micro-pleats with a lustrous sheen that catches evening light with every step.",
      badge: "",
      sizes: ["S", "M", "L"],
      colors: ["Bronze", "Silver", "Rose Gold"],
      stock: 20,
      featured: false
    },
    {
      id: "prod-5",
      title: "Vanguard Ribbed Turtleneck Sweater",
      price: 120.00,
      category: "Knitwear",
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800",
      description: "Ultra-soft merino wool blend offering breathable warmth and a refined high neck silhouette.",
      badge: "Popular",
      sizes: ["XS", "S", "M", "L"],
      colors: ["Oatmeal", "Black", "Forest Green"],
      stock: 25,
      featured: true
    },
    {
      id: "prod-6",
      title: "Sovereign Leather Tote Bag",
      price: 395.00,
      category: "Accessories",
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
      description: "Full-grain Italian calfskin with brushed gold hardware. Roomy interior compartment designed for daily essentials.",
      badge: "Handcrafted",
      sizes: ["One Size"],
      colors: ["Cognac", "Black", "Taupe"],
      stock: 6,
      featured: true
    }
  ],
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
    featured: Boolean(req.body.featured)
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
    customerAuthType: req.body.customerAuthType || undefined
  };
  data.orders.unshift(newOrder);
  saveStoreData(data);
  res.json({ success: true, order: newOrder });
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
