export interface Product {
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

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  selectedImage?: string;
}

export interface BannerAd {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  linkText: string;
  buttonText?: string;
  link?: string;
  active: boolean;
  tag: string;
}

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image?: string;
}

export interface Order {
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

export interface CustomerUser {
  id: string;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  authProvider: 'google' | 'phone' | 'email';
}

export interface StoreSettings {
  bkashNumber: string;
  bkashType: 'Personal' | 'Merchant' | 'Agent';
  nagadNumber: string;
  nagadType: 'Personal' | 'Merchant';
  rocketNumber?: string;
  paymentInstructions?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  facebookUrl?: string;
  promoNotice?: string;
  isPromoActive?: boolean;
  deliveryChargeInsideDhaka?: number;
  deliveryChargeOutsideDhaka?: number;
  announcementText?: string;
  isAnnouncementActive?: boolean;
  customCategories?: string[];
  deletedCategories?: string[];
  // Custom App Download settings ("Download apps")
  appApkUrl?: string;
  appApkVersion?: string;
  appApkSize?: string;
  appDownloadNotes?: string;
  appButtonText?: string; // e.g. "Download apps"
  isAppDownloadEnabled?: boolean;
}

