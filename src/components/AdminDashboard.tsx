import React, { useState, useEffect } from 'react';
import { Product, Order, BannerAd, StoreSettings, AdConfiguration, WebsiteAdItem, AdType, AdPlacement } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingCart, 
  AlertTriangle, 
  Ticket, 
  Megaphone, 
  MessageSquare, 
  Settings, 
  ShieldCheck, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  RefreshCw, 
  LogOut, 
  AlertCircle, 
  Download, 
  Globe, 
  Search, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Copy,
  Share2,
  ExternalLink,
  Sparkles,
  Layers,
  Star,
  Database,
  Upload,
  Image as ImageIcon,
  Percent,
  Tag,
  Truck,
  ShieldAlert,
  UserCheck,
  CreditCard,
  Phone,
  Smartphone,
  Eye,
  XCircle,
  RotateCcw,
  Archive,
  MessageCircle
} from 'lucide-react';
import { 
  saveProductToFirestore, 
  deleteProductFromFirestore, 
  updateOrderStatusInFirestore, 
  updateOrderTrackingInFirestore,
  deleteOrderFromFirestore,
  hideOrderFromAdminInFirestore,
  restoreOrderToAdminInFirestore,
  createBannerInFirestore,
  updateBannerInFirestore,
  deleteBannerFromFirestore,
  saveStoreSettings,
  saveAdConfig,
  DEFAULT_ADMIN_EMAILS
} from '../firebase';
import { initialAdConfig } from '../data/initialData';

// Curated high quality fashion photos for 1-click selection from Admin Panel
const CURATED_GALLERY = [
  {
    category: "Traditional & Sarees (শাড়ি ও দেশীয়)",
    photos: [
      { title: "Crimson Jamdani Saree", url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800" },
      { title: "Emerald Silk Katan Saree", url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800" },
      { title: "Royal Gold Embroidered Saree", url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800" },
      { title: "Festive Lehenga Choli", url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800" },
      { title: "Designer Kurti Set", url: "https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&q=80&w=800" },
      { title: "Embroidered Men's Panjabi", url: "https://images.unsplash.com/photo-1627914713280-928efad971ca?auto=format&fit=crop&q=80&w=800" },
    ]
  },
  {
    category: "Dresses & Gowns (ড্রেস ও গাউন)",
    photos: [
      { title: "Serenade Silk Midi Dress", url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800" },
      { title: "Elysian Velvet Evening Gown", url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800" },
      { title: "Floral Chiffon Wrap Dress", url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=800" },
      { title: "Minimalist Linen Sundress", url: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&q=80&w=800" },
    ]
  },
  {
    category: "Outerwear & Blazers (কোট ও ব্লেজার)",
    photos: [
      { title: "Cashmere Oversized Coat", url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800" },
      { title: "Tailored Italian Blazer", url: "https://images.unsplash.com/photo-1550639525-c97d455acf70?auto=format&fit=crop&q=80&w=800" },
      { title: "Merino Wool Trench", url: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800" },
      { title: "Ribbed Knitwear Cardigan", url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800" },
    ]
  },
  {
    category: "Bags & Accessories (ব্যাগ ও জুয়েলারি)",
    photos: [
      { title: "Italian Leather Tote Bag", url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800" },
      { title: "Classic Gold Accent Clutch", url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800" },
      { title: "Handcrafted Luxury Jewelry", url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800" },
      { title: "Silk Evening Scarf", url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=800" },
    ]
  }
];

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, status: string) => void;
  onMarkDelivered: (id: string) => void;
  onDeleteOrder: (order: Order, permanent?: boolean) => void;
  onUpdateTracking: (id: string, trackingData: { courierName: string; trackingNumber: string; trackingUrl: string; trackingNotes: string }) => void;
  onRestoreOrder?: (id: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus, onMarkDelivered, onDeleteOrder, onUpdateTracking, onRestoreOrder }) => {
  const [courierName, setCourierName] = useState(order.courierName || '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || '');
  const [trackingNotes, setTrackingNotes] = useState(order.trackingNotes || '');
  const [isEditingTracking, setIsEditingTracking] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTracking(order.id, { courierName, trackingNumber, trackingUrl, trackingNotes });
    setIsEditingTracking(false);
  };

  return (
    <div className={`p-5 bg-white rounded-2xl border shadow-xs space-y-4 ${
      order.deletedByAdmin 
        ? 'border-dashed border-amber-300 bg-amber-50/20' 
        : order.status === 'Cancelled'
        ? 'border-rose-200'
        : 'border-slate-200'
    }`}>
      {/* If hidden from admin panel, show notice with restore and permanent delete actions */}
      {order.deletedByAdmin && (
        <div className="flex flex-wrap items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 gap-2">
          <div className="flex items-center gap-2 font-medium">
            <Archive className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>প্যানেল থেকে সরানো অর্ডার:</strong> এটি অ্যাক্টিভ অ্যাডমিন প্যানেল থেকে লুকানো হয়েছে।
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onRestoreOrder && (
              <button
                type="button"
                onClick={() => onRestoreOrder(order.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                title="অর্ডারটি আবার অ্যাক্টিভ অ্যাডমিন প্যানেলে আনুন"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>পুনরুদ্ধার (Restore)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onDeleteOrder(order, true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
              title="অর্ডারটি ডাটাবেস থেকে স্থায়ীভাবে চিরতরে ডিলিট করুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>স্থায়ীভাবে ডিলিট (Delete)</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-sm text-slate-900">#{order.id}</span>
          <select
            value={order.status}
            onChange={(e) => onUpdateStatus(order.id, e.target.value)}
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
              order.status === 'Cancelled'
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : order.status === 'Delivered'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : order.status === 'Shipped'
                ? 'bg-blue-50 text-blue-800 border-blue-300'
                : order.status === 'Processing'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-800 border-slate-300'
            }`}
          >
            <option value="Pending">Pending (পেন্ডিং)</option>
            <option value="Processing">Processing (প্রসেসিং)</option>
            <option value="Shipped">Shipped (শিপড)</option>
            <option value="Delivered">Delivered (ডেলিভারি সম্পন্ন)</option>
            <option value="Cancelled">❌ Cancelled (বাতিল)</option>
          </select>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {order.isFirstOrder && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs flex items-center gap-1">
              <span>🌟</span>
              <span>১ম অর্ডার (First Order)</span>
            </span>
          )}
          {order.deliveryArea && (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              order.deliveryArea === 'Outside Dhaka'
                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                : 'bg-sky-50 text-sky-800 border border-sky-300'
            }`}>
              {order.deliveryArea} (+৳{order.deliveryCharge || (order.deliveryArea === 'Outside Dhaka' ? 150 : 80)})
            </span>
          )}
          <span className="text-base font-extrabold text-slate-900">৳{order.totalAmount.toLocaleString()}</span>

          {order.status === 'Cancelled' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-800 rounded-xl text-xs font-bold border border-rose-300">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>বাতিল (Cancelled)</span>
            </div>
          ) : order.status === 'Delivered' ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ডেলিভারি সম্পন্ন</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onMarkDelivered(order.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="ডেলিভারি সম্পন্ন লিস্টে যুক্ত করুন"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>ডেলিভারি সম্পন্ন করুন</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'Cancelled')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="অর্ডারটি বাতিল করুন (কাস্টমার ট্র্যাকিং পেজে বাতিল দেখতে পাবে)"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>বাতিল করুন</span>
              </button>
            </div>
          )}

          {/* WhatsApp Direct Chat & Details Button */}
          {(() => {
            const rawPhone = order.phone || '';
            let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
            if (cleanPhone.startsWith('0')) cleanPhone = '88' + cleanPhone;
            else if (!cleanPhone.startsWith('880') && cleanPhone.length === 10) cleanPhone = '880' + cleanPhone;

            const orderMsg = `🛍️ *হিমায়া ফ্যাশন — অর্ডার #${order.id}*\nগ্রাহক: ${order.customerName}\nফোন: ${order.phone}\nমোট বিল: ৳${order.totalAmount}\nস্ট্যাটাস: ${order.status}\nডেলিভারি ঠিকানা: ${order.address}, ${order.city}`;
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(orderMsg)}`;

            return (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-xl transition-all cursor-pointer border border-emerald-200 hover:border-emerald-600 shadow-xs flex items-center gap-1 text-xs font-semibold"
                title="গ্রাহকের সাথে হোয়াটসঅ্যাপে চ্যাট করুন"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            );
          })()}

          <button
            type="button"
            onClick={() => onDeleteOrder(order, !!order.deletedByAdmin)}
            className={`p-2 rounded-xl transition-all cursor-pointer shadow-xs ${
              order.deletedByAdmin
                ? 'text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-300'
                : 'text-rose-500 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600'
            }`}
            title={order.deletedByAdmin ? "অর্ডারটি স্থায়ীভাবে চিরতরে ডিলিট করুন (Permanent Delete)" : "অর্ডার অ্যাডমিন প্যানেল থেকে সরান (গ্রাহকের ডাটা অক্ষুণ্ণ থাকবে)"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs text-slate-600">
        <div><strong className="text-slate-900 block text-[11px] uppercase text-slate-400">Customer</strong> {order.customerName}</div>
        <div><strong className="text-slate-900 block text-[11px] uppercase text-slate-400">Phone</strong> {order.phone}</div>
        <div><strong className="text-slate-900 block text-[11px] uppercase text-slate-400">Delivery Zone</strong> {order.deliveryArea || 'Inside Dhaka'} (৳{order.deliveryCharge || 80})</div>
        <div><strong className="text-slate-900 block text-[11px] uppercase text-slate-400">City / District</strong> {order.city}</div>
        <div><strong className="text-slate-900 block text-[11px] uppercase text-slate-400">Address</strong> {order.address}</div>
      </div>

      {/* Payment Details Card (bKash / Nagad / COD) */}
      <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-500 uppercase text-[10px]">পেমেন্ট মেথড:</span>
          {order.paymentMethod === 'bkash' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-100 border border-pink-300 text-pink-800 rounded-lg font-bold">
              <span className="w-2 h-2 rounded-full bg-pink-600" />
              bKash (বিকাশ)
            </span>
          ) : order.paymentMethod === 'nagad' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 border border-orange-300 text-orange-800 rounded-lg font-bold">
              <span className="w-2 h-2 rounded-full bg-orange-600" />
              Nagad (নগদ)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 border border-slate-300 text-slate-800 rounded-lg font-bold">
              Cash on Delivery (ক্যাশ অন ডেলিভারি)
            </span>
          )}

          {order.paymentSenderPhone && (
            <span className="text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
              প্রেরক নম্বর: <strong className="font-mono text-slate-900">{order.paymentSenderPhone}</strong>
            </span>
          )}

          {order.paymentTrxId && (
            <span className="text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
              TrxID: <strong className="font-mono text-pink-700 uppercase">{order.paymentTrxId}</strong>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(order.paymentTrxId || '');
                }}
                className="text-[10px] text-slate-500 hover:text-slate-900 cursor-pointer"
                title="কপি করুন"
              >
                <Copy className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
        <div className="text-slate-500 text-[11px]">
          তারিখ: {new Date(order.createdAt).toLocaleDateString('bn-BD')} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Courier Tracking Section */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-xs text-slate-900">কুরিয়ার ও লাইভ ট্র্যাকিং লিংক (Courier & Live Tracking)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingTracking(!isEditingTracking)}
            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            {isEditingTracking ? 'বন্ধ করুন' : (order.trackingUrl || order.courierName ? 'ট্র্যাকিং এডিট করুন' : '+ ট্র্যাকিং লিংক যুক্ত করুন')}
          </button>
        </div>

        {!isEditingTracking ? (
          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-4">
            <div><strong>Courier:</strong> {order.courierName || <span className="text-slate-400">Not specified</span>}</div>
            <div><strong>Tracking No:</strong> <span className="font-mono">{order.trackingNumber || <span className="text-slate-400">N/A</span>}</span></div>
            <div><strong>Status Note:</strong> {order.trackingNotes || <span className="text-slate-400">No notes</span>}</div>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
              >
                <span>Live Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">কুরিয়ার সার্ভিস নাম (যেমন: Steadfast, Pathao, RedX)</label>
                <input
                  type="text"
                  placeholder="e.g. Steadfast Courier"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ট্র্যাকিং নম্বর বা কনসાઇનমেন্ট আইডি</label>
                <input
                  type="text"
                  placeholder="e.g. ST-948291"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">লাইভ ট্র্যাকিং URL / লিংক (Live Tracking Link)</label>
                <input
                  type="url"
                  placeholder="https://steadfast.com.bd/t/..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ট্র্যাকিং নোট (যেমন: রাইডার রওনা হয়েছে)</label>
                <input
                  type="text"
                  placeholder="e.g. Out for delivery today"
                  value={trackingNotes}
                  onChange={(e) => setTrackingNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingTracking(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                ট্র্যাকিং সেভ করুন (Save Tracking)
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Ordered Items with exact Variant Picture, Size, and Color */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
          <span>অর্ডার করা প্রডাক্ট ও ভ্যারিয়েন্ট ({order.items.length} items):</span>
          <span className="text-[11px] font-normal text-slate-500">গ্রাহক যে ভ্যারিয়েন্ট ও ছবি সিলেক্ট করে অর্ডার করেছেন</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {order.items.map((item, idx) => (
            <div key={`${order.id}-item-${idx}`} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              {item.image ? (
                <a href={item.image} target="_blank" rel="noopener noreferrer" className="shrink-0" title="বড় করে ছবি দেখতে ক্লিক করুন">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-14 h-16 object-cover rounded-lg bg-white border border-slate-200 shadow-2xs hover:scale-105 transition-transform"
                  />
                </a>
              ) : (
                <div className="w-14 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs shrink-0">
                  No Img
                </div>
              )}
              <div className="min-w-0 flex-1 text-xs">
                <h6 className="font-bold text-slate-900 truncate" title={item.title}>
                  {item.title}
                </h6>
                <div className="flex flex-wrap gap-1 mt-1 text-[11px]">
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold">
                    রং: <strong className="text-emerald-700">{item.color}</strong>
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold">
                    সাইজ: <strong className="text-blue-700">{item.size}</strong>
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-slate-500">পরিমাণ: <strong className="text-slate-900">{item.quantity}x</strong></span>
                  <span className="font-bold text-[#C5A059]">৳{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  banners?: BannerAd[];
  orders: Order[];
  onRefreshData: () => void | Promise<void>;
  onOpenFirebaseGuide?: () => void;
  currentUser?: { email: string | null; displayName?: string | null; photoURL?: string | null } | null;
  isAdminUser?: boolean;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
  adminEmails?: string[];
  onUpdateAdminEmails?: (emails: string[]) => Promise<void>;
  storeSettings?: StoreSettings;
  onUpdateStoreSettings?: (settings: StoreSettings) => void;
  onUpdateBanners?: (banners: BannerAd[]) => void;
  onDeleteProduct?: (productId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  adConfig?: AdConfiguration;
  onUpdateAdConfig?: (config: AdConfiguration) => void;
}

type AdminTab = 
  | 'dashboard' 
  | 'products' 
  | 'categories' 
  | 'orders' 
  | 'banners' 
  | 'payment_settings' 
  | 'stock_alerts' 
  | 'coupons' 
  | 'ads_promos' 
  | 'reviews' 
  | 'settings'
  | 'app_install';

interface CouponItem {
  id: string;
  code: string;
  discount: string;
  minSpend: number;
  status: 'Active' | 'Expired';
}

interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  status: 'Approved' | 'Pending';
}

const BANNER_PRESETS = [
  {
    title: "Summer 2026 Ready-To-Wear",
    subtitle: "Artisanal elegance crafted from the finest heritage silks and handcrafted embellishments.",
    tag: "Haute Couture",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1600",
    buttonText: "Explore Collection"
  },
  {
    title: "The Regal Jamdani & Katan Collection",
    subtitle: "Timeless traditional ensembles woven with authentic golden zari and majestic motifs.",
    tag: "Exclusive Festive",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1600",
    buttonText: "Shop Sarees"
  },
  {
    title: "Prestige Menswear & Royal Panjabi",
    subtitle: "Impeccably tailored kurtas and waistcoats for celebratory occasions and Eid celebrations.",
    tag: "Signature Menswear",
    image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&q=80&w=1600",
    buttonText: "Discover Panjabis"
  },
  {
    title: "Luxury Bridal Lehengas",
    subtitle: "Exquisite craftsmanship, opulent embroidery, and handcrafted silhouettes for your special day.",
    tag: "Bridal Couture",
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=1600",
    buttonText: "View Lehengas"
  }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  products,
  banners = [],
  orders,
  onRefreshData,
  onOpenFirebaseGuide,
  currentUser,
  isAdminUser,
  onSignInGoogle,
  onSignOut,
  adminEmails = DEFAULT_ADMIN_EMAILS,
  onUpdateAdminEmails,
  storeSettings,
  onUpdateStoreSettings,
  onUpdateBanners,
  onDeleteProduct,
  onDeleteOrder,
  adConfig,
  onUpdateAdConfig,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPinEmergency, setShowPinEmergency] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [localBanners, setLocalBanners] = useState<BannerAd[]>(banners);
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [localAdConfig, setLocalAdConfig] = useState<AdConfiguration>(adConfig || initialAdConfig);
  const [isAddingAd, setIsAddingAd] = useState(false);
  const [editingAd, setEditingAd] = useState<WebsiteAdItem | null>(null);
  const [isSavingAdConfig, setIsSavingAdConfig] = useState(false);
  const [adFilter, setAdFilter] = useState<'all' | 'popunder' | 'script_banner' | 'direct_link'>('all');
  const [adForm, setAdForm] = useState<{
    name: string;
    type: AdType;
    enabled: boolean;
    linkUrl: string;
    scriptCode: string;
    placement: AdPlacement;
  }>({
    name: '',
    type: 'popunder',
    enabled: true,
    linkUrl: '',
    scriptCode: '',
    placement: 'popunder'
  });
  const [popunderCooldownInput, setPopunderCooldownInput] = useState<number>(adConfig?.popunderCooldownMinutes || 1);

  useEffect(() => {
    if (adConfig) {
      setLocalAdConfig(adConfig);
      setPopunderCooldownInput(adConfig.popunderCooldownMinutes || 1);
    }
  }, [adConfig]);

  // Banner form state
  const [editingBanner, setEditingBanner] = useState<BannerAd | null>(null);
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    tag: 'Special Collection',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1600',
    buttonText: 'Explore Collection',
    link: '#product-grid',
    active: true
  });
  const [isUploadingBannerImg, setIsUploadingBannerImg] = useState(false);

  // Store settings state (bKash, Nagad, delivery charges, announcement)
  const [localSettings, setLocalSettings] = useState<StoreSettings>({
    bkashNumber: storeSettings?.bkashNumber || '01712-345678',
    bkashType: storeSettings?.bkashType || 'Personal',
    nagadNumber: storeSettings?.nagadNumber || '01912-345678',
    nagadType: storeSettings?.nagadType || 'Personal',
    rocketNumber: storeSettings?.rocketNumber || '',
    paymentInstructions: storeSettings?.paymentInstructions || "বিকাশ বা নগদ অ্যাপ থেকে 'Send Money' অথবা 'Payment' করে আপনার নম্বর ও TrxID লিখুন।",
    deliveryChargeInsideDhaka: storeSettings?.deliveryChargeInsideDhaka ?? 80,
    deliveryChargeOutsideDhaka: storeSettings?.deliveryChargeOutsideDhaka ?? 150,
    contactPhone: storeSettings?.contactPhone || '+880 1712-345678',
    contactEmail: storeSettings?.contactEmail || 'support@himayafashion.com',
    whatsappNumber: storeSettings?.whatsappNumber || '8801712345678',
    facebookUrl: storeSettings?.facebookUrl || 'https://facebook.com/himayafashion',
    announcementText: storeSettings?.announcementText || '✨ Summer Bespoke Collection · Complimentary Shipping on Orders over ৳5000',
    isAnnouncementActive: storeSettings?.isAnnouncementActive ?? true,
    appApkUrl: storeSettings?.appApkUrl || '/uploads/himaya-fashion.apk',
    appApkVersion: storeSettings?.appApkVersion || 'v1.2.0',
    appApkSize: storeSettings?.appApkSize || '16.8 MB',
    appDownloadNotes: storeSettings?.appDownloadNotes || 'Official Himaya Fashion Android App. Instant shopping, push order updates & exclusive member offers.',
    appButtonText: storeSettings?.appButtonText || 'Download apps',
    isAppDownloadEnabled: storeSettings?.isAppDownloadEnabled ?? true
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingAppFile, setIsUploadingAppFile] = useState(false);
  const [appFileUploadProgress, setAppFileUploadProgress] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'archived'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'product' | 'order' | 'coupon' | 'category';
    id: string;
    title: string;
    isPermanentOrder?: boolean;
    categoryProductCount?: number;
  } | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminEmailMsg, setAdminEmailMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloadingSource, setIsDownloadingSource] = useState(false);
  const [isDownloadingNetlify, setIsDownloadingNetlify] = useState(false);

  const handleReload = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (onRefreshData) {
        await Promise.resolve(onRefreshData());
      }
      try {
        const [pRes, oRes, bRes] = await Promise.all([
          fetch('/api/products').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/orders').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/banners').then(r => r.ok ? r.json() : null).catch(() => null),
        ]);
        if (Array.isArray(pRes) && pRes.length > 0) setLocalProducts(pRes);
        if (Array.isArray(oRes)) setLocalOrders(oRes);
        if (Array.isArray(bRes) && bRes.length > 0) setLocalBanners(bRes);
      } catch {}
      setToastMessage("সর্বশেষ ডাটা সফলভাবে রিলোড ও সিঙ্ক হয়েছে! (Live data reloaded)");
    } catch (err) {
      console.error("Reload error:", err);
      setToastMessage("রিলোড সম্পন্ন হয়েছে!");
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

  // Auto-authenticate when verified admin user is logged in
  useEffect(() => {
    if (isAdminUser) {
      setIsAuthenticated(true);
      setLoginError('');
    }
  }, [isAdminUser]);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  useEffect(() => {
    if (banners && banners.length > 0) {
      setLocalBanners(banners);
    }
  }, [banners]);

  useEffect(() => {
    if (storeSettings) {
      setLocalSettings(prev => ({
        ...prev,
        ...storeSettings,
        bkashNumber: storeSettings.bkashNumber || prev.bkashNumber || '',
        bkashType: storeSettings.bkashType || prev.bkashType || 'Personal',
        nagadNumber: storeSettings.nagadNumber || prev.nagadNumber || '',
        nagadType: storeSettings.nagadType || prev.nagadType || 'Personal',
        rocketNumber: storeSettings.rocketNumber || prev.rocketNumber || '',
        paymentInstructions: storeSettings.paymentInstructions || prev.paymentInstructions || '',
        deliveryChargeInsideDhaka: storeSettings.deliveryChargeInsideDhaka ?? prev.deliveryChargeInsideDhaka ?? 80,
        deliveryChargeOutsideDhaka: storeSettings.deliveryChargeOutsideDhaka ?? prev.deliveryChargeOutsideDhaka ?? 150,
        contactPhone: storeSettings.contactPhone || prev.contactPhone || '',
        contactEmail: storeSettings.contactEmail || prev.contactEmail || '',
        whatsappNumber: storeSettings.whatsappNumber || prev.whatsappNumber || '',
        facebookUrl: storeSettings.facebookUrl || prev.facebookUrl || '',
        announcementText: storeSettings.announcementText || prev.announcementText || '',
        isAnnouncementActive: storeSettings.isAnnouncementActive ?? prev.isAnnouncementActive ?? true,
        appApkUrl: storeSettings.appApkUrl || prev.appApkUrl || '/uploads/himaya-fashion.apk',
        appApkVersion: storeSettings.appApkVersion || prev.appApkVersion || 'v1.2.0',
        appApkSize: storeSettings.appApkSize || prev.appApkSize || '16.8 MB',
        appDownloadNotes: storeSettings.appDownloadNotes || prev.appDownloadNotes || '',
        appButtonText: storeSettings.appButtonText || prev.appButtonText || 'Download apps',
        isAppDownloadEnabled: storeSettings.isAppDownloadEnabled ?? prev.isAppDownloadEnabled ?? true
      }));
    }
  }, [storeSettings]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Product form state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    title: '',
    price: 1800,
    originalPrice: 2400,
    category: 'Dresses',
    image: '',
    images: [] as string[],
    description: '',
    badge: 'New',
    sizes: 'S, M, L, XL',
    colors: 'Black, Maroon, Navy',
    stock: 12,
    featured: true
  });

  // Gallery and upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCuratedGalleryModal, setShowCuratedGalleryModal] = useState(false);
  const [curatedCategoryIndex, setCuratedCategoryIndex] = useState(0);
  const [discountPercentInput, setDiscountPercentInput] = useState<string>('');

  // AI Product Assistant state
  const [aiRawText, setAiRawText] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Robust client-side smart parser that works 100% on static hosts like Netlify, offline, or when API is unavailable
  const parseProductClientSide = (text: string, categoriesList: string[]) => {
    // 1. Convert Bengali numerals to Western digits
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    let normalized = text;
    bengaliDigits.forEach((d, i) => {
      normalized = normalized.split(d).join(String(i));
    });

    // 2. Extract Price & Regular Price
    let price: number | null = null;
    let originalPrice: number | null = null;

    const saleMatch = normalized.match(/(?:sale|offer|discount|স্পেশাল|অফার|বিক্রয়|সেল)\s*(?:price|মূল্য|দাম)?[:\s৳]*(\d{2,7})/i);
    const regularMatch = normalized.match(/(?:regular|mrp|original|আসল|মূল)\s*(?:price|মূল্য|দাম)?[:\s৳]*(\d{2,7})/i);
    
    const generalMatches = [...normalized.matchAll(/(?:price|tk|taka|টাকা|bdt|৳)[:\s]*(\d{2,7})|(\d{2,7})\s*(?:tk|taka|টাকা|bdt|৳)/gi)];
    const allFoundNumbers: number[] = [];
    generalMatches.forEach(m => {
      const num = parseInt(m[1] || m[2], 10);
      if (!isNaN(num) && num >= 50 && num <= 500000) allFoundNumbers.push(num);
    });

    if (saleMatch) {
      price = parseInt(saleMatch[1], 10);
    }
    if (regularMatch) {
      originalPrice = parseInt(regularMatch[1], 10);
    }

    if (!price && allFoundNumbers.length > 0) {
      if (allFoundNumbers.length >= 2) {
        allFoundNumbers.sort((a, b) => a - b);
        price = allFoundNumbers[0];
        if (!originalPrice) originalPrice = allFoundNumbers[1];
      } else {
        price = allFoundNumbers[0];
      }
    }

    if (!price || isNaN(price)) {
      price = 2800;
    }
    if (!originalPrice || isNaN(originalPrice) || originalPrice <= price) {
      originalPrice = Math.round(price * 1.25);
    }

    // 3. Category matching
    let category = categoriesList[0] || 'Outerwear';
    const lowerText = text.toLowerCase();
    
    for (const cat of categoriesList) {
      if (lowerText.includes(cat.toLowerCase())) {
        category = cat;
        break;
      }
    }

    if (category === categoriesList[0]) {
      if (/শাড়ি|saree|shari|jamdani|silk|জর্জেট|কাতান|বোরকা|abaya|hijab/i.test(text)) {
        category = categoriesList.find(c => /trad|dress|abaya|shari|saree/i.test(c)) || 'Traditional';
      } else if (/পাঞ্জাবি|panjabi|kurta|sherwani/i.test(text)) {
        category = categoriesList.find(c => /trad|panjabi|men/i.test(c)) || 'Traditional';
      } else if (/gown|dress|গাউন|ফ্রক|কামিজ|kurti/i.test(text)) {
        category = categoriesList.find(c => /dress|outer/i.test(c)) || 'Dresses';
      } else if (/skirt|স্কার্ট/i.test(text)) {
        category = categoriesList.find(c => /skirt/i.test(c)) || 'Skirts';
      } else if (/knit|sweater|সোয়েটার|হুডি|hoodie|cardigan/i.test(text)) {
        category = categoriesList.find(c => /knit/i.test(c)) || 'Knitwear';
      } else if (/bag|ব্যাগ|জুয়েলারি|jewelry|watch|belt/i.test(text)) {
        category = categoriesList.find(c => /access/i.test(c)) || 'Accessories';
      }
    }

    // 4. Stock quantity
    let stock = 12;
    const stockMatch = normalized.match(/(?:stock|স্টক|পরিমাণ|qty|quantity)[:\s]*(\d{1,4})|(\d{1,4})\s*(?:pcs|pieces|পিস|টি)/i);
    if (stockMatch) {
      const parsedStock = parseInt(stockMatch[1] || stockMatch[2], 10);
      if (!isNaN(parsedStock) && parsedStock > 0) stock = parsedStock;
    }

    // 5. Sizes
    let sizes = "Free Size";
    if (/free\s*size|ফ্রি\s*সাইজ/i.test(text)) {
      sizes = "Free Size";
    } else if (/unstitched|আনস্টিচ/i.test(text)) {
      sizes = "Unstitched";
    } else {
      const sizeMatch = text.match(/(?:size[s]?|সাইজ)[:\s]*([^\n\.,]+)/i);
      if (sizeMatch && sizeMatch[1].trim()) {
        sizes = sizeMatch[1].trim();
      } else if (/s,\s*m,\s*l|m,\s*l,\s*xl/i.test(text)) {
        sizes = "S, M, L, XL";
      }
    }

    // 6. Colors
    let colors = "Crimson, Black, Gold";
    const colorMatch = text.match(/(?:color[s]?|কালার|রং)[:\s]*([^\n\.,]+)/i);
    if (colorMatch && colorMatch[1].trim()) {
      colors = colorMatch[1].trim();
    } else {
      const detectedColors: string[] = [];
      const colorMap: Record<string, string> = {
        'red': 'Red', 'লাল': 'Red',
        'black': 'Black', 'কালো': 'Black',
        'white': 'White', 'সাদা': 'White',
        'maroon': 'Maroon', 'মেরুন': 'Maroon',
        'gold': 'Gold', 'গোল্ডেন': 'Gold',
        'blue': 'Blue', 'নীল': 'Blue',
        'navy': 'Navy Blue', 'নেভি': 'Navy Blue',
        'green': 'Green', 'সবুজ': 'Green',
        'emerald': 'Emerald Green',
        'pink': 'Pink', 'গোলাপি': 'Pink',
      };
      for (const [k, v] of Object.entries(colorMap)) {
        if (lowerText.includes(k) && !detectedColors.includes(v)) {
          detectedColors.push(v);
        }
      }
      if (detectedColors.length > 0) {
        colors = detectedColors.join(', ');
      }
    }

    // 7. Title Extraction
    let title = "";
    const cleanLines = text.split(/[\n\.]/).map(l => l.trim()).filter(l => l.length > 0);
    if (cleanLines.length > 0) {
      let first = cleanLines[0]
        .replace(/(?:price|tk|taka|দাম|মূল্য|৳).*$/i, '')
        .replace(/[:\-–—]+$/, '')
        .trim();
      if (first.length >= 3) {
        title = first;
      }
    }

    if (!title || title.length < 3) {
      const trimmed = text.trim();
      if (trimmed.length > 0 && trimmed.length < 40) {
        title = `Himaya Collection - ${trimmed}`;
      } else {
        title = "Himaya Luxury Couture Piece";
      }
    }

    // 8. Badge
    let badge = "New";
    if (/sale|ডিসকাউন্ট|অফার|ছাড়/i.test(text)) badge = "Sale";
    else if (/exclusive|এক্সক্লুসিভ|প্রিমিয়াম|luxury/i.test(text)) badge = "Exclusive";
    else if (/limited|সীমিত/i.test(text)) badge = "Limited";
    else if (/hot|জনপ্রিয়|popular/i.test(text)) badge = "Hot";

    // 9. Description
    const description = text.trim().length > 35
      ? text.trim()
      : `${title}. Premium luxury apparel crafted with exquisite tailoring, fine breathable fabrics, and timeless elegance for Himaya Fashion.`;

    return {
      title,
      category,
      price,
      originalPrice,
      description,
      stock,
      sizes,
      colors,
      badge
    };
  };

  const handleAiAutoFillProduct = async () => {
    if (!aiRawText || !aiRawText.trim()) {
      setAiError('দয়া করে প্রডাক্টের বর্ণনা বা বিবরণ লিখুন (যেমন: নাম, দাম, সাইজ, কালার...)');
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);

    try {
      let parsed: any = null;

      try {
        // Attempt backend API (e.g. Gemini route on dev/server)
        const res = await fetch('/api/gemini/parse-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: aiRawText,
            categories: allCategories
          })
        });

        const contentType = res.headers.get('content-type') || '';
        // Only attempt JSON parsing if server returned application/json (prevents <!DOCTYPE HTML> crash on static hosts like Netlify)
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json && json.success && json.data) {
            parsed = json.data;
          }
        }
      } catch (networkOrApiErr) {
        console.warn('Backend AI route unavailable, using built-in smart parser:', networkOrApiErr);
      }

      // If backend was not available (e.g., Netlify static host) or failed, seamlessly use intelligent client-side parser
      if (!parsed) {
        parsed = parseProductClientSide(aiRawText, allCategories);
      }

      // Populate product form safely
      setProductForm(prev => {
        const matchedCategory = parsed.category && allCategories.find(c => c.toLowerCase() === parsed.category.toLowerCase());
        return {
          ...prev,
          title: parsed.title || prev.title,
          category: matchedCategory || (parsed.category || prev.category),
          price: typeof parsed.price === 'number' && !isNaN(parsed.price) ? parsed.price : prev.price,
          originalPrice: typeof parsed.originalPrice === 'number' && !isNaN(parsed.originalPrice)
            ? parsed.originalPrice
            : (typeof parsed.price === 'number' ? Math.round(parsed.price * 1.25) : prev.originalPrice),
          description: parsed.description || prev.description,
          stock: typeof parsed.stock === 'number' && !isNaN(parsed.stock) ? parsed.stock : prev.stock,
          sizes: parsed.sizes || prev.sizes,
          colors: parsed.colors || prev.colors,
          badge: parsed.badge !== undefined ? parsed.badge : prev.badge,
        };
      });

      setToastMessage('✨ এআই অটো-ফিল সফল হয়েছে! প্রডাক্টের সকল ফিল্ড পূরণ হয়েছে।');
    } catch (err) {
      console.error('AI Auto-fill error:', err);
      // Even if any unexpected error occurs, fall back directly to client-side parser so user never sees an error
      try {
        const fallbackParsed = parseProductClientSide(aiRawText, allCategories);
        setProductForm(prev => ({
          ...prev,
          title: fallbackParsed.title,
          category: fallbackParsed.category,
          price: fallbackParsed.price,
          originalPrice: fallbackParsed.originalPrice,
          description: fallbackParsed.description,
          stock: fallbackParsed.stock,
          sizes: fallbackParsed.sizes,
          colors: fallbackParsed.colors,
          badge: fallbackParsed.badge,
        }));
        setToastMessage('✨ প্রডাক্টের সকল তথ্য সফলভাবে অটো-ফিল হয়েছে!');
      } catch {
        setAiError('অটো-ফিল করার জন্য কিছু টেক্সট লিখুন (যেমন: জামদানী শাড়ি, দাম ৩৫০০)।');
      }
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    const addedImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Attempt server upload for persistent file storage
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data })
          });
          const data = await res.json();
          if (data.success && data.url) {
            addedImages.push(data.url);
          } else {
            addedImages.push(base64Data);
          }
        } catch {
          addedImages.push(base64Data);
        }
      } catch (err) {
        console.error("Error reading image:", err);
      }
    }

    if (addedImages.length > 0) {
      setProductForm(prev => {
        const existing = prev.images || (prev.image ? [prev.image] : []);
        const combined = [...existing, ...addedImages];
        return {
          ...prev,
          image: prev.image || addedImages[0],
          images: combined
        };
      });
    }
    setIsUploadingImage(false);
    e.target.value = '';
  };

  const handleAddCuratedImage = (url: string) => {
    setProductForm(prev => {
      const existing = prev.images || (prev.image ? [prev.image] : []);
      if (existing.includes(url)) return prev;
      const combined = [...existing, url];
      return {
        ...prev,
        image: prev.image || url,
        images: combined
      };
    });
  };

  const handleSetMainPhoto = (url: string) => {
    setProductForm(prev => ({
      ...prev,
      image: url
    }));
  };

  const handleRemovePhoto = (urlToRemove: string) => {
    setProductForm(prev => {
      const updatedList = (prev.images || []).filter(u => u !== urlToRemove);
      let newMain = prev.image;
      if (prev.image === urlToRemove) {
        newMain = updatedList.length > 0 ? updatedList[0] : '';
      }
      return {
        ...prev,
        image: newMain,
        images: updatedList
      };
    });
  };

  const handleApplyDiscountPercentage = (percentage: number) => {
    const currentRegular = productForm.originalPrice || productForm.price;
    if (!currentRegular || currentRegular <= 0) return;
    const discountedPrice = Math.round(currentRegular * (1 - percentage / 100));
    setProductForm(prev => ({
      ...prev,
      originalPrice: currentRegular,
      price: discountedPrice,
      badge: percentage >= 20 ? `${percentage}% OFF` : (prev.badge || 'Sale')
    }));
    setDiscountPercentInput(String(percentage));
  };

  // Coupons state (persisted in local storage)
  const [coupons, setCoupons] = useState<CouponItem[]>(() => {
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
      { id: '4', code: 'BDSHOPVIP', discount: '৳250 OFF', minSpend: 2000, status: 'Active' },
    ];
  });
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('');
  const [newCouponMinSpend, setNewCouponMinSpend] = useState('500');

  // Categories state
  const [newCategoryName, setNewCategoryName] = useState('');
  const defaultCategories = ['Outerwear', 'Dresses', 'Knitwear', 'Skirts', 'Accessories', 'Traditional'];

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (storeSettings?.customCategories && Array.isArray(storeSettings.customCategories) && storeSettings.customCategories.length > 0) {
      return storeSettings.customCategories;
    }
    try {
      const saved = localStorage.getItem('himaya_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultCategories;
  });

  const [deletedCategories, setDeletedCategories] = useState<string[]>(() => {
    if (storeSettings?.deletedCategories && Array.isArray(storeSettings.deletedCategories)) {
      return storeSettings.deletedCategories;
    }
    try {
      const saved = localStorage.getItem('himaya_deleted_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    if (storeSettings?.customCategories && Array.isArray(storeSettings.customCategories) && storeSettings.customCategories.length > 0) {
      setCustomCategories(storeSettings.customCategories);
    }
    if (storeSettings?.deletedCategories && Array.isArray(storeSettings.deletedCategories)) {
      setDeletedCategories(storeSettings.deletedCategories);
    }
  }, [storeSettings?.customCategories, storeSettings?.deletedCategories]);

  const allCategories = Array.from(new Set([
    ...customCategories,
    ...localProducts.map(p => p.category)
  ])).filter(cat => Boolean(cat) && !deletedCategories.includes(cat));

  const handleAddCategory = async (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setToastMessage(`ক্যাটাগরি "${trimmed}" ইতিমধ্যে তালিকায় রয়েছে!`);
      return;
    }
    const updatedCustom = Array.from(new Set([...customCategories, trimmed]));
    const updatedDeleted = deletedCategories.filter(d => d.toLowerCase() !== trimmed.toLowerCase());
    setCustomCategories(updatedCustom);
    setDeletedCategories(updatedDeleted);
    try {
      localStorage.setItem('himaya_custom_categories', JSON.stringify(updatedCustom));
      localStorage.setItem('himaya_deleted_categories', JSON.stringify(updatedDeleted));
    } catch {}

    const updatedSettings: StoreSettings = {
      ...localSettings,
      customCategories: updatedCustom,
      deletedCategories: updatedDeleted
    };
    if (onUpdateStoreSettings) {
      onUpdateStoreSettings(updatedSettings);
    }
    saveStoreSettings(updatedSettings).catch(() => {});
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customCategories: updatedCustom, deletedCategories: updatedDeleted })
    }).catch(() => {});

    setNewCategoryName('');
    setToastMessage(`ক্যাটাগরি "${trimmed}" সফলভাবে তৈরি হয়েছে!`);
  };

  const handlePromptDeleteCategory = (cat: string) => {
    const count = localProducts.filter(p => p.category === cat).length;
    setDeleteModal({
      isOpen: true,
      type: 'category',
      id: cat,
      title: cat,
      categoryProductCount: count
    });
  };

  // Promos & Announcement state
  const [promoMessage, setPromoMessage] = useState('Special Eid Offer: Free Nationwide Express Shipping on Orders Over ৳2,000!');
  const [isPromoActive, setIsPromoActive] = useState(true);
  const [promoSavedAlert, setPromoSavedAlert] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>([
    { id: '1', author: 'Nusrat Jahan', rating: 5, comment: 'The fabric quality of the evening gown is superb! Premium packaging as well.', date: '2 days ago', status: 'Approved' },
    { id: '2', author: 'Tanvir Ahmed', rating: 5, comment: 'Fast delivery in Dhaka. Very satisfied with the customer service and fit.', date: '4 days ago', status: 'Approved' },
    { id: '3', author: 'Sadia Rahman', rating: 4, comment: 'Beautiful stitching and colors. Will order again next season.', date: '1 week ago', status: 'Approved' },
  ]);

  // Version info
  const [versionInfo, setVersionInfo] = useState<{ version: string; updateAvailable: boolean; changelog: string } | null>(null);

  useEffect(() => {
    fetch('/api/version')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setVersionInfo(data); })
      .catch(() => {});
  }, []);

  // Low stock products
  const lowStockProducts = localProducts.filter(p => (p.stock || 0) <= 5);
  const totalRevenue = orders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'Invalid PIN (Try: 1234)');
      }
    } catch {
      setLoginError('Authentication network error.');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const allImages = productForm.images && productForm.images.length > 0 
      ? productForm.images 
      : (productForm.image ? [productForm.image] : []);
    const mainImg = productForm.image || allImages[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800';

    const payload = {
      ...productForm,
      image: mainImg,
      images: allImages,
      price: Number(productForm.price),
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
      stock: Number(productForm.stock),
      sizes: productForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: productForm.colors.split(',').map(c => c.trim()).filter(Boolean)
    };

    const targetId = editingProduct ? editingProduct.id : ("prod-" + Date.now());
    const fullProduct: Product = {
      id: targetId,
      ...payload
    };

    try {
      // Direct Firestore write
      await saveProductToFirestore(fullProduct);
    } catch (e) {
      console.warn("Firestore product save:", e);
    }

    if (editingProduct) {
      await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }

    setEditingProduct(null);
    setIsAddingProduct(false);
    setProductForm({
      title: '',
      price: 1800,
      originalPrice: 2400,
      category: 'Dresses',
      image: '',
      images: [],
      description: '',
      badge: 'New',
      sizes: 'S, M, L, XL',
      colors: 'Black, Maroon, Navy',
      stock: 12,
      featured: true
    });
    setDiscountPercentInput('');
    onRefreshData();
  };

  const handlePromptDeleteProduct = (product: Product) => {
    setDeleteModal({
      isOpen: true,
      type: 'product',
      id: product.id,
      title: product.title
    });
  };

  const handlePromptDeleteOrder = (order: Order, forcePermanent?: boolean) => {
    const isPermanent = forcePermanent ?? !!order.deletedByAdmin;
    setDeleteModal({
      isOpen: true,
      type: 'order',
      id: order.id,
      title: `Order #${order.id} (${order.customerName})`,
      isPermanentOrder: isPermanent
    });
  };

  const handlePromptDeleteCoupon = (coupon: CouponItem) => {
    setDeleteModal({
      isOpen: true,
      type: 'coupon',
      id: coupon.id,
      title: `কুপন কোড: ${coupon.code} (${coupon.discount})`
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    const { type, id, title, isPermanentOrder } = deleteModal;
    setDeleteModal(null);

    try {
      if (type === 'product') {
        setLocalProducts(prev => prev.filter(p => p.id !== id));
        if (onDeleteProduct) onDeleteProduct(id);
        await deleteProductFromFirestore(id).catch(err => console.warn("Firestore delete warning:", err));
        await fetch(`/api/products/${id}`, { method: 'DELETE' }).catch(() => {});
        onRefreshData();
        setToastMessage(`প্রডাক্ট "${title}" সফলভাবে ডিলিট করা হয়েছে!`);
      } else if (type === 'order') {
        if (isPermanentOrder) {
          // Permanently delete order from memory, parent state, Firestore, and backend API
          setLocalOrders(prev => prev.filter(o => o.id !== id));
          if (onDeleteOrder) onDeleteOrder(id);
          await deleteOrderFromFirestore(id).catch(err => console.warn("Firestore permanent delete warning:", err));
          await fetch(`/api/orders/${id}?permanent=true`, { method: 'DELETE' }).catch(() => {});
          onRefreshData();
          setToastMessage(`অর্ডার #${id} স্থায়ীভাবে (Permanently) ডিলিট করা হয়েছে!`);
        } else {
          // Safe deletion from Admin Panel:
          // Set deletedByAdmin to true in Firestore and API so the customer's tracking and order history remain intact!
          await hideOrderFromAdminInFirestore(id).catch(err => console.warn("Firestore hide order warning:", err));
          await fetch(`/api/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deletedByAdmin: true })
          }).catch(() => {});
          setLocalOrders(prev => prev.map(o => o.id === id ? { ...o, deletedByAdmin: true } : o));
          onRefreshData();
          setToastMessage(`অর্ডার #${id} অ্যাডমিন প্যানেল থেকে সফলভাবে সরানো হয়েছে! ('সরানো অর্ডার' ট্যাবে পাওয়া যাবে)`);
        }
      } else if (type === 'coupon') {
        const updatedCoupons = coupons.filter(c => c.id !== id);
        setCoupons(updatedCoupons);
        try {
          localStorage.setItem('himaya_coupons', JSON.stringify(updatedCoupons));
        } catch {}
        setToastMessage(`কুপন/ভাউচার "${title}" সফলভাবে ডিলিট করা হয়েছে!`);
      } else if (type === 'category') {
        const updatedCustom = customCategories.filter(c => c !== id);
        const updatedDeleted = Array.from(new Set([...deletedCategories, id]));
        setCustomCategories(updatedCustom);
        setDeletedCategories(updatedDeleted);
        try {
          localStorage.setItem('himaya_custom_categories', JSON.stringify(updatedCustom));
          localStorage.setItem('himaya_deleted_categories', JSON.stringify(updatedDeleted));
        } catch {}

        const updatedSettings: StoreSettings = {
          ...localSettings,
          customCategories: updatedCustom,
          deletedCategories: updatedDeleted
        };
        if (onUpdateStoreSettings) {
          onUpdateStoreSettings(updatedSettings);
        }
        saveStoreSettings(updatedSettings).catch(() => {});
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customCategories: updatedCustom, deletedCategories: updatedDeleted })
        }).catch(() => {});

        // If any products belong to this category, re-assign them to 'General'
        const prodsToUpdate = localProducts.filter(p => p.category === id);
        if (prodsToUpdate.length > 0) {
          setLocalProducts(prev => prev.map(p => p.category === id ? { ...p, category: 'General' } : p));
          for (const p of prodsToUpdate) {
            const updatedP = { ...p, category: 'General' };
            saveProductToFirestore(updatedP).catch(() => {});
            fetch(`/api/products/${p.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category: 'General' })
            }).catch(() => {});
          }
        }

        onRefreshData();
        setToastMessage(`ক্যাটাগরি "${title}" সফলভাবে ডিলিট করা হয়েছে!${prodsToUpdate.length > 0 ? ` (${prodsToUpdate.length}টি পণ্য 'General' ক্যাটাগরিতে স্থানান্তরিত হয়েছে)` : ''}`);
      }
    } catch (err) {
      console.error("Delete operation error:", err);
      setToastMessage(`ডিলিট করতে সমস্যা হয়েছে: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Restore an order that was hidden from Admin Panel
  const handleRestoreOrder = async (orderId: string) => {
    try {
      await restoreOrderToAdminInFirestore(orderId).catch(err => console.warn("Firestore restore order warning:", err));
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedByAdmin: false })
      }).catch(() => {});
      setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, deletedByAdmin: false } : o));
      onRefreshData();
      setToastMessage(`অর্ডার #${orderId} সফলভাবে অ্যাডমিন প্যানেলে পুনরুদ্ধার করা হয়েছে!`);
    } catch (err) {
      console.error("Failed to restore order", err);
      setToastMessage("অর্ডার পুনরুদ্ধার করতে সমস্যা হয়েছে!");
    }
  };

  // Dedicated Mark as Delivered handler (Delivery Button)
  const handleMarkDelivered = async (orderId: string) => {
    try {
      await updateOrderStatusInFirestore(orderId, 'Delivered').catch(() => {});
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Delivered' })
      }).catch(() => {});
      setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Delivered' } : o));
      onRefreshData();
      setToastMessage(`অর্ডার #${orderId} সফলভাবে ডেলিভারি সম্পন্ন (Delivered) সেকশনে যুক্ত হয়েছে!`);
    } catch (err) {
      console.error("Failed to mark delivered", err);
      setToastMessage("ডেলিভারি স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে!");
    }
  };

  const handleUpdateTracking = async (orderId: string, trackingData: { courierName: string; trackingNumber: string; trackingUrl: string; trackingNotes: string }) => {
    try {
      await updateOrderTrackingInFirestore(orderId, trackingData).catch(() => {});
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingData)
      }).catch(() => {});
      setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...trackingData } : o));
      onRefreshData();
      setToastMessage(`অর্ডার #${orderId} এর কুরিয়ার ও ট্র্যাকিং লিংক সফলভাবে সেভ করা হয়েছে!`);
    } catch (err) {
      console.error("Failed to update tracking", err);
      setToastMessage("ট্র্যাকিং তথ্য সেভ করতে সমস্যা হয়েছে!");
    }
  };

  const handleRestock = async (productId: string, addAmount: number) => {
    const current = localProducts.find(p => p.id === productId);
    if (!current) return;
    const newStock = Math.max(0, (current.stock || 0) + addAmount);
    const updatedProd: Product = { ...current, stock: newStock };
    try {
      await saveProductToFirestore(updatedProd).catch(() => {});
      await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      }).catch(() => {});
      setLocalProducts(prev => prev.map(p => p.id === productId ? updatedProd : p));
      onRefreshData();
    } catch (err) {
      console.error("Failed to restock product", err);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateOrderStatusInFirestore(orderId, status as Order['status']).catch(() => {});
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }).catch(() => {});
      setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as Order['status'] } : o));
      onRefreshData();
      if (status === 'Cancelled') {
        setToastMessage(`অর্ডার #${orderId} সফলভাবে বাতিল (Cancelled) করা হয়েছে! কাস্টমার লাইভ ট্র্যাকিং পেজে এটি 'Cancelled / বাতিল' দেখতে পাবে।`);
      } else {
        setToastMessage(`অর্ডার #${orderId} স্ট্যাটাস পরিবর্তন: ${status}`);
      }
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !newCouponDiscount.trim()) return;
    const newCoupon: CouponItem = {
      id: String(Date.now()),
      code: newCouponCode.trim().toUpperCase(),
      discount: newCouponDiscount.trim(),
      minSpend: Number(newCouponMinSpend) || 500,
      status: 'Active'
    };
    const updated = [newCoupon, ...coupons];
    setCoupons(updated);
    try {
      localStorage.setItem('himaya_coupons', JSON.stringify(updated));
    } catch {}
    setNewCouponCode('');
    setNewCouponDiscount('');
    setToastMessage(`নতুন কুপন "${newCoupon.code}" সফলভাবে তৈরি করা হয়েছে!`);
  };

  const handleToggleCouponStatus = (couponId: string) => {
    const updated = coupons.map(c => 
      c.id === couponId 
        ? { ...c, status: (c.status === 'Active' ? 'Expired' : 'Active') as 'Active' | 'Expired' }
        : c
    );
    setCoupons(updated);
    try {
      localStorage.setItem('himaya_coupons', JSON.stringify(updated));
    } catch {}
    setToastMessage('কুপন স্ট্যাটাস পরিবর্তন করা হয়েছে!');
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const handleDownloadSource = async () => {
    if (isDownloadingSource) return;
    setIsDownloadingSource(true);
    setToastMessage("ফুল সোর্স কোড প্যাকেজ (.zip) প্রস্তুত করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...");

    try {
      const response = await fetch('/api/export-source', {
        method: 'GET',
        headers: {
          'Accept': 'application/zip'
        }
      });

      if (!response.ok) {
        throw new Error(`সার্ভার এরর: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = 'himaya-fashion-source-package.zip';
      document.body.appendChild(downloadLink);
      downloadLink.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(downloadLink);
      }, 500);

      setToastMessage("✅ সোর্স প্যাকেজ (.zip) সফলভাবে ডাউনলোড হয়েছে!");
    } catch (err) {
      console.error("ZIP download failed via fetch, attempting fallback:", err);
      // Direct window navigation fallback
      try {
        const link = document.createElement('a');
        link.href = '/api/export-source';
        link.setAttribute('download', 'himaya-fashion-source-package.zip');
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToastMessage("ডাউনলোড শুরু হয়েছে!");
      } catch (fallbackErr) {
        setToastMessage(`ডাউনলোড ব্যর্থ হয়েছে: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setIsDownloadingSource(false);
    }
  };

  const handleDownloadNetlifyPackage = async () => {
    if (isDownloadingNetlify) return;
    setIsDownloadingNetlify(true);
    setToastMessage("Netlify রেডি প্যাকেজ প্রস্তুত করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...");

    try {
      const response = await fetch('/api/export-netlify', {
        method: 'GET',
        headers: { 'Accept': 'application/zip' }
      });

      if (!response.ok) {
        throw new Error(`সার্ভার এরর: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = 'himaya-fashion-netlify-ready.zip';
      document.body.appendChild(downloadLink);
      downloadLink.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(downloadLink);
      }, 500);

      setToastMessage("✅ Netlify রেডি প্যাকেজ ডাউনলোড হয়েছে! আনজিপ করে সরাসরি Netlify Drop-এ দিন।");
    } catch (err) {
      try {
        const link = document.createElement('a');
        link.href = '/api/export-netlify';
        link.setAttribute('download', 'himaya-fashion-netlify-ready.zip');
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToastMessage("Netlify প্যাকেজ ডাউনলোড শুরু হয়েছে!");
      } catch (fallbackErr) {
        setToastMessage(`ডাউনলোড ব্যর্থ হয়েছে: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setIsDownloadingNetlify(false);
    }
  };

  // Banner Handlers
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title || !bannerForm.image) {
      setToastMessage("দয়া করে ব্যানারের টাইটেল ও ছবি দিন!");
      return;
    }

    try {
      if (editingBanner) {
        const updated: BannerAd = {
          ...editingBanner,
          title: bannerForm.title,
          subtitle: bannerForm.subtitle,
          tag: bannerForm.tag,
          image: bannerForm.image,
          buttonText: bannerForm.buttonText,
          link: bannerForm.link,
          active: bannerForm.active
        };

        await updateBannerInFirestore(updated).catch(() => {});
        await fetch(`/api/banners/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(() => {});

        const newBanners = localBanners.map(b => b.id === updated.id ? updated : b);
        setLocalBanners(newBanners);
        if (onUpdateBanners) onUpdateBanners(newBanners);
        setToastMessage(`ব্যানার "${updated.title}" সফলভাবে আপডেট হয়েছে!`);
      } else {
        const newBanner: BannerAd = {
          id: `ban-${Date.now()}`,
          title: bannerForm.title,
          subtitle: bannerForm.subtitle,
          tag: bannerForm.tag,
          image: bannerForm.image,
          linkText: bannerForm.buttonText || 'Shop Now',
          buttonText: bannerForm.buttonText,
          link: bannerForm.link,
          active: bannerForm.active
        };

        await createBannerInFirestore(newBanner).catch(() => {});
        await fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBanner)
        }).catch(() => {});

        const newBanners = [...localBanners, newBanner];
        setLocalBanners(newBanners);
        if (onUpdateBanners) onUpdateBanners(newBanners);
        setToastMessage(`নতুন ব্যানার "${newBanner.title}" সফলভাবে যুক্ত হয়েছে!`);
      }

      setEditingBanner(null);
      setIsAddingBanner(false);
      onRefreshData();
    } catch (err) {
      console.error("Failed to save banner:", err);
      setToastMessage("ব্যানার সেভ করতে সমস্যা হয়েছে!");
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      await deleteBannerFromFirestore(bannerId).catch(() => {});
      await fetch(`/api/banners/${bannerId}`, { method: 'DELETE' }).catch(() => {});
      const newBanners = localBanners.filter(b => b.id !== bannerId);
      setLocalBanners(newBanners);
      if (onUpdateBanners) onUpdateBanners(newBanners);
      setToastMessage("ব্যানার সফলভাবে মুছে ফেলা হয়েছে!");
      onRefreshData();
    } catch (err) {
      console.error("Failed to delete banner:", err);
    }
  };

  const handleBannerImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBannerImg(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 })
          });
          const data = await res.json();
          if (data.success && data.url) {
            setBannerForm(prev => ({ ...prev, image: data.url }));
          } else {
            setBannerForm(prev => ({ ...prev, image: base64 }));
          }
        } catch {
          setBannerForm(prev => ({ ...prev, image: base64 }));
        }
        setIsUploadingBannerImg(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingBannerImg(false);
    }
  };

  // Store Settings Save Handler
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await saveStoreSettings(localSettings).catch(() => {});
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings)
      }).catch(() => {});

      if (onUpdateStoreSettings) {
        onUpdateStoreSettings(localSettings);
      }
      setToastMessage("বিকাশ, নগদ ও স্টোর সেটিংস সফলভাবে সেভ করা হয়েছে!");
    } catch (err) {
      console.error("Failed to save settings:", err);
      setToastMessage("সেটিংস সেভ করতে সমস্যা হয়েছে!");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Upload ANY file of admin's choice for "Download apps" feature
  const handleUploadAppFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAppFile(true);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";
    setAppFileUploadProgress(`আপলোড হচ্ছে (${file.name} · ${sizeMb})...`);

    try {
      // 1. Direct binary upload (streams raw file directly, no base64 memory overhead)
      let res = await fetch('/api/upload-app-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-file-name': encodeURIComponent(file.name)
        },
        body: file
      }).catch(() => null);

      // 2. If direct binary failed or was not accepted, try base64 fallback
      if (!res || !res.ok) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        res = await fetch('/api/upload-app-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name
          })
        });
      }

      if (!res.ok) {
        throw new Error(`সার্ভার এরর: ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.url) {
        const updated: StoreSettings = {
          ...localSettings,
          appApkUrl: result.url,
          appApkSize: result.size || sizeMb,
          isAppDownloadEnabled: true
        };
        setLocalSettings(updated);
        if (onUpdateStoreSettings) {
          onUpdateStoreSettings(updated);
        }
        saveStoreSettings(updated).catch(() => {});
        setToastMessage(`✅ ফাইল "${file.name}" সফলভাবে আপলোড ও ডাউনলোড লিঙ্কে যুক্ত হয়েছে!`);
      } else {
        throw new Error(result.error || "আপলোড ব্যর্থ হয়েছে");
      }
    } catch (uploadErr) {
      console.error("App file upload error:", uploadErr);
      setToastMessage(`ফাইল আপলোড ব্যর্থ হয়েছে: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`);
    } finally {
      setIsUploadingAppFile(false);
      setAppFileUploadProgress(null);
    }
    e.target.value = '';
  };

  // Ad Management Handlers
  const handleSaveAdConfigToStorage = async (newConfig: AdConfiguration) => {
    setLocalAdConfig(newConfig);
    if (onUpdateAdConfig) {
      onUpdateAdConfig(newConfig);
    }
    setIsSavingAdConfig(true);
    try {
      await saveAdConfig(newConfig);
      fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      }).catch(() => {});
      setToastMessage('✅ বিজ্ঞাপন সেটিংস সফলভাবে সেভ হয়েছে!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save ad configuration:', err);
      setToastMessage('বিজ্ঞাপন সেটিংস সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSavingAdConfig(false);
    }
  };

  const handleToggleGlobalAds = () => {
    const updated = {
      ...localAdConfig,
      globalAdsEnabled: !localAdConfig.globalAdsEnabled,
      updatedAt: new Date().toISOString()
    };
    handleSaveAdConfigToStorage(updated);
  };

  const handleToggleAd = (adId: string) => {
    const updatedAds = localAdConfig.ads.map(ad => 
      ad.id === adId ? { ...ad, enabled: !ad.enabled } : ad
    );
    const updated = {
      ...localAdConfig,
      ads: updatedAds,
      updatedAt: new Date().toISOString()
    };
    handleSaveAdConfigToStorage(updated);
  };

  const handleDeleteAd = (adId: string) => {
    if (window.confirm('আপনি কি এই বিজ্ঞাপনটি মুছে ফেলতে চান?')) {
      const updatedAds = localAdConfig.ads.filter(ad => ad.id !== adId);
      const updated = {
        ...localAdConfig,
        ads: updatedAds,
        updatedAt: new Date().toISOString()
      };
      handleSaveAdConfigToStorage(updated);
    }
  };

  const handleOpenAddAd = () => {
    setEditingAd(null);
    setAdForm({
      name: '',
      type: 'popunder',
      enabled: true,
      linkUrl: '',
      scriptCode: '',
      placement: 'popunder'
    });
    setIsAddingAd(true);
  };

  const handleOpenEditAd = (ad: WebsiteAdItem) => {
    setEditingAd(ad);
    setAdForm({
      name: ad.name,
      type: ad.type,
      enabled: ad.enabled,
      linkUrl: ad.linkUrl || '',
      scriptCode: ad.scriptCode || '',
      placement: ad.placement || (ad.type === 'popunder' ? 'popunder' : 'floating_corner')
    });
    setIsAddingAd(true);
  };

  const handleSaveAdForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.name.trim()) {
      alert('বিজ্ঞাপনের নাম বা টাইটেল দিন');
      return;
    }

    if (adForm.type === 'popunder' || adForm.type === 'direct_link') {
      if (!adForm.linkUrl.trim()) {
        alert('বিজ্ঞাপন লিংক (URL) দিন');
        return;
      }
    }

    if (adForm.type === 'script_banner' || adForm.type === 'custom_html') {
      if (!adForm.scriptCode.trim()) {
        alert('স্ক্রিপ্ট বা ব্যানার কোড দিন');
        return;
      }
    }

    let updatedAds: WebsiteAdItem[];
    if (editingAd) {
      updatedAds = localAdConfig.ads.map(ad => {
        if (ad.id === editingAd.id) {
          return {
            ...ad,
            name: adForm.name.trim(),
            type: adForm.type,
            enabled: adForm.enabled,
            linkUrl: adForm.linkUrl.trim() || undefined,
            scriptCode: adForm.scriptCode.trim() || undefined,
            placement: adForm.placement
          };
        }
        return ad;
      });
    } else {
      const newAdItem: WebsiteAdItem = {
        id: 'ad-' + Date.now(),
        name: adForm.name.trim(),
        type: adForm.type,
        enabled: adForm.enabled,
        linkUrl: adForm.linkUrl.trim() || undefined,
        scriptCode: adForm.scriptCode.trim() || undefined,
        placement: adForm.placement,
        createdAt: new Date().toISOString()
      };
      updatedAds = [newAdItem, ...localAdConfig.ads];
    }

    const updated = {
      ...localAdConfig,
      ads: updatedAds,
      updatedAt: new Date().toISOString()
    };
    handleSaveAdConfigToStorage(updated);
    setIsAddingAd(false);
    setEditingAd(null);
  };

  const handleSaveCooldown = (minutes: number) => {
    const updated = {
      ...localAdConfig,
      popunderCooldownMinutes: Math.max(0, minutes),
      updatedAt: new Date().toISOString()
    };
    handleSaveAdConfigToStorage(updated);
  };

  const handleResetToAdsterraDefaults = () => {
    if (window.confirm('আপনি কি Adsterra ডিফল্ট পপআন্ডার ও 160x300 ব্যানার রিস্টোর করতে চান?')) {
      handleSaveAdConfigToStorage(initialAdConfig);
    }
  };

  // Nav items matching user's requirements
  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; alert?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package, badge: localProducts.length },
    { id: 'categories', label: 'Categories', icon: FolderTree, badge: allCategories.length },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: orders.length },
    { id: 'banners', label: 'Home Banners (ব্যানার)', icon: ImageIcon, badge: localBanners.length },
    { id: 'payment_settings', label: 'bKash/Nagad (পেমেন্ট)', icon: CreditCard },
    { id: 'stock_alerts', label: 'Stock Alerts', icon: AlertTriangle, badge: lowStockProducts.length, alert: lowStockProducts.length > 0 },
    { id: 'coupons', label: 'Coupons', icon: Ticket, badge: coupons.length },
    { id: 'ads_promos', label: 'Ads & Links (বিজ্ঞাপন)', icon: Megaphone, badge: (localAdConfig.ads || []).filter(a => a.enabled).length },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare, badge: reviews.length },
    { id: 'settings', label: 'Website Settings', icon: Settings },
    { id: 'app_install', label: 'Download Apps (ফাইল কন্ট্রোল)', icon: Smartphone },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-7xl h-full sm:h-[94vh] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {!isAuthenticated ? (
          /* Login Screen with Google Auth & Admin Gmail Verification */
          <div className="flex-1 flex items-center justify-center p-6 bg-[#0B1120] overflow-y-auto">
            <div className="bg-[#111827] border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-6 text-center text-white">
              
              {currentUser && !isAdminUser ? (
                /* Logged in with unauthorized Gmail */
                <>
                  <div className="w-16 h-16 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <ShieldAlert className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-400 text-[11px] font-semibold tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Access Restricted &middot; প্রবেশাধিকার সংরক্ষিত
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-white">অ্যাডমিন অনুমতি নেই</h3>
                    <p className="text-xs text-slate-300">
                      লগইন করা অ্যাকাউন্ট: <strong className="text-amber-400 font-mono">{currentUser.email}</strong>
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      এই জিমেইল অ্যাকাউন্টে অ্যাডমিন পারমিশন নেই। কাস্টমারদের জন্য অ্যাডমিন প্যানেল সম্পূর্ণ লুকায়িত। অনুগ্রহ করে অনুমোদিত অ্যাডমিন জিমেইল (যেমন: <span className="text-emerald-400 font-mono">mhemal136@gmail.com</span>) দিয়ে লগইন করুন।
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {onSignInGoogle && (
                      <button
                        type="button"
                        onClick={onSignInGoogle}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>অনুমোদিত জিমেইল দিয়ে লগইন করুন</span>
                      </button>
                    )}

                    {onSignOut && (
                      <button
                        type="button"
                        onClick={onSignOut}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        লগআউট করুন (Sign Out)
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* Not logged in: Show Google Sign-in as Primary */
                <>
                  <div className="w-16 h-16 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <ShieldCheck className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Himaya Fashion &middot; Admin Authentication
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-white">অ্যাডমিন প্রবেশাধিকার</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      অ্যাডমিন প্যানেলটি কাস্টমারদের থেকে সম্পূর্ণ গোপন রাখা হয়েছে। শুধুমাত্র অনুমোদিত জিমেইল দিয়ে সাইন ইন করলে প্যানেলটি আনলক হবে।
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center justify-center gap-2 text-left">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* Primary Google Login Button */}
                  {onSignInGoogle && (
                    <button
                      type="button"
                      onClick={onSignInGoogle}
                      className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                      </svg>
                      <span>গুগল দিয়ে লগইন করুন (Google Sign In)</span>
                    </button>
                  )}

                  <div className="text-[11px] text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    অনুমোদিত সুপার অ্যাডমিন: <span className="text-emerald-400 font-mono font-semibold">mhemal136@gmail.com</span>
                  </div>
                </>
              )}

              {/* Emergency PIN Toggle */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPinEmergency(!showPinEmergency)}
                  className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                >
                  {showPinEmergency ? 'পিন কোড অপশন লুকান' : 'বিকল্প পিন কোড দিয়ে আনলক করুন (Emergency PIN)'}
                </button>

                {showPinEmergency && (
                  <form onSubmit={handleLogin} className="mt-4 space-y-3">
                    <input
                      type="password"
                      placeholder="Master PIN (Default: 1234)"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full px-4 py-2.5 text-center text-sm font-semibold tracking-widest bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      পিন যাচাই করুন (Verify PIN)
                    </button>
                  </form>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                <span>Himaya Luxury BD</span>
                <button type="button" onClick={onClose} className="hover:text-slate-300 underline cursor-pointer">
                  Close Window
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <>
            {/* LEFT SIDEBAR - Matches Screenshot exactly */}
            <aside className="w-full md:w-64 lg:w-72 bg-[#090E1A] text-white flex flex-col flex-shrink-0 border-r border-slate-800/80">
              {/* Header with BD logo, badge, and live sync indicator */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C5A059] to-[#E5C98B] p-0.5 shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src="/icons/logo.png" alt="Himaya" className="w-full h-full rounded-[10px] object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="font-bold text-white text-sm tracking-wide">HIMAYA</h2>
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
                        Admin Portal v1.2
                      </span>
                    </div>
                    {onOpenFirebaseGuide ? (
                      <button 
                        onClick={onOpenFirebaseGuide}
                        className="flex items-center gap-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 mt-0.5 truncate text-left transition-colors cursor-pointer"
                        title="Click to view Firebase setup guide and cloud status"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                        <span className="truncate font-medium">Firebase Firestore Connected</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-0.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                        <span className="truncate font-medium">Firebase Firestore Connected</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Menu Buttons */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 flex md:flex-col overflow-x-auto md:overflow-x-hidden">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsAddingProduct(false);
                        setEditingProduct(null);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 ${
                            isActive
                              ? 'bg-black/30 text-white'
                              : item.alert
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Quick Bar */}
              <div className="p-3 border-t border-slate-800 bg-[#070B14] flex flex-col gap-1.5">
                <button
                  onClick={handleDownloadSource}
                  disabled={isDownloadingSource}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                  title="Export full application source code + dist as ZIP"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Download Source (.zip)</span>
                </button>
                <button
                  onClick={handleDownloadNetlifyPackage}
                  disabled={isDownloadingNetlify}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 rounded-xl text-[10px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                  title="Download pre-built files ready for direct Netlify Drop"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Netlify Ready (.zip)</span>
                </button>
                <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500">
                  <button
                    onClick={handleReload}
                    disabled={isRefreshing}
                    className="flex items-center gap-1.5 hover:text-slate-300 transition-colors cursor-pointer disabled:opacity-60"
                    title="Sync and reload latest data"
                  >
                    <RefreshCw className={`w-3 h-3 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
                  </button>
                  <button
                    onClick={() => setIsAuthenticated(false)}
                    className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Lock</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT WORKSPACE */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-hidden">
              {/* Top Bar with Title, Search, Refresh, Close */}
              <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4 flex-shrink-0 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg capitalize">
                    {activeTab.replace('_', ' ')}
                  </h3>
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                    Store Admin
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Firebase Cloud Active Badge - Only visible in Admin Panel */}
                  <button 
                    onClick={onOpenFirebaseGuide}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] sm:text-xs tracking-normal transition-colors cursor-pointer shadow-xs"
                    title="Firebase Cloud Database is active. Click to view guide & status details."
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                    <span>Firebase Cloud Active</span>
                  </button>

                  <div className="relative hidden lg:block">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search inventory, orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg w-48 lg:w-56 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                    />
                  </div>

                  <button
                    onClick={handleReload}
                    disabled={isRefreshing}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer disabled:opacity-60 ${
                      isRefreshing 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                        : 'bg-white text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-300 shadow-2xs active:scale-95'
                    }`}
                    title="Reload latest live data (ডাটা রিলোড করুন)"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
                    <span className="hidden sm:inline font-semibold">{isRefreshing ? 'রিলোড হচ্ছে...' : 'রিলোড'}</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    aria-label="Close Admin"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </header>

              {/* Scrollable View Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                
                {/* 1. DASHBOARD VIEW */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total Revenue</p>
                          <p className="text-2xl font-extrabold text-slate-900 mt-1">৳{totalRevenue.toLocaleString()}</p>
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3" /> From live orders
                          </span>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg">
                          ৳
                        </div>
                      </div>

                      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total Products</p>
                          <p className="text-2xl font-extrabold text-slate-900 mt-1">{localProducts.length}</p>
                          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                            Across {allCategories.length} categories
                          </span>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                          <Package className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Customer Orders</p>
                          <p className="text-2xl font-extrabold text-slate-900 mt-1">{orders.length}</p>
                          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                            Real-time order logging
                          </span>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Low Stock Alerts</p>
                          <p className={`text-2xl font-extrabold mt-1 ${lowStockProducts.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {lowStockProducts.length}
                          </p>
                          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                            Items &le; 5 units left
                          </span>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockProducts.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                      </div>
                    </div>

                    {/* Quick Navigation Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div 
                        onClick={() => setActiveTab('products')}
                        className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer shadow-xs group"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">Manage Products</h4>
                          <Package className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Add new dresses, coats, and edit prices or images.</p>
                      </div>

                      <div 
                        onClick={() => setActiveTab('orders')}
                        className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer shadow-xs group"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">Process Orders</h4>
                          <ShoppingCart className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">View customer delivery addresses and order items.</p>
                      </div>

                      <div 
                        onClick={() => setActiveTab('coupons')}
                        className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer shadow-xs group"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">Coupons & Promo</h4>
                          <Ticket className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Create discount vouchers and promo announcements.</p>
                      </div>
                    </div>

                    {/* Recent Orders Overview */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Recent Customer Orders</h4>
                          <p className="text-xs text-slate-500">Latest transactions registered in the store.</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('orders')} 
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          View All &rarr;
                        </button>
                      </div>

                      {orders.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No orders placed yet. Place a test checkout from the storefront!
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {orders.slice(0, 4).map((ord, idx) => (
                            <div key={`${ord.id}-${idx}`} className="py-3 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-800">{ord.customerName}</span>
                                <span className="text-slate-400 ml-2 font-mono">({ord.id})</span>
                                <div className="text-[11px] text-slate-500 mt-0.5">{ord.phone} &middot; {ord.city}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-slate-900">৳{ord.totalAmount.toLocaleString()}</div>
                                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold mt-0.5">
                                  {ord.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. PRODUCTS VIEW */}
                {activeTab === 'products' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">Product Inventory (প্রডাক্ট ইনভেন্টরি)</h4>
                        <p className="text-xs text-slate-500">Add, edit, and delete products live on the website.</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setIsAddingProduct(!isAddingProduct);
                          setProductForm({
                            title: '',
                            price: 1800,
                            originalPrice: 2400,
                            category: 'Dresses',
                            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
                            images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'],
                            description: '',
                            badge: '25% OFF',
                            sizes: 'S, M, L, XL',
                            colors: 'Maroon, Navy, Black',
                            stock: 15,
                            featured: true
                          });
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/20 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isAddingProduct ? 'Close Form' : 'Add New Product (নতুন পণ্য যোগ)'}</span>
                      </button>
                    </div>

                    {/* Product Form Editor (Visible when Adding or Editing) */}
                    {(isAddingProduct || editingProduct) && (
                      <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500/30 shadow-lg space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h5 className="font-bold text-slate-900 text-base flex items-center gap-2">
                              <Package className="w-5 h-5 text-emerald-600" />
                              {editingProduct ? `Edit Product: ${editingProduct.title}` : 'Create New Boutique Product (নতুন প্রডাক্ট)'}
                            </h5>
                            <p className="text-xs text-slate-500 mt-0.5">গ্যালারি থেকে ছবি যোগ করুন ও কাস্টমারদের জন্য আকর্ষণীয় ডিসকাউন্ট সেট করুন</p>
                          </div>
                          <button
                            onClick={() => {
                              setEditingProduct(null);
                              setIsAddingProduct(false);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-6">
                          {/* AI Product Assistant Box */}
                          <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/80 to-emerald-50 border-2 border-indigo-200/90 rounded-2xl space-y-3.5 shadow-xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                  <Sparkles className="w-4 h-4 animate-pulse" />
                                </div>
                                <div>
                                  <h6 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                                    <span>AI Product Assistant (স্মার্ট এআই প্রোডাক্ট সহকারী)</span>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-600 text-white uppercase tracking-wider">
                                      Gemini AI
                                    </span>
                                  </h6>
                                  <p className="text-[11px] text-slate-600">
                                    এখানে প্রডাক্টের কাঁচা বর্ণনা বা নোটস পেস্ট করুন। এআই অটোমেটিক নাম, ক্যাটাগরি, প্রাইস, সাইজ, কালার, স্টক ও ডেসক্রিপশন পূরণ করবে। (ছবি আপলোড থাকবে ম্যানুয়াল process)
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <textarea
                                rows={3}
                                value={aiRawText}
                                onChange={e => {
                                  setAiRawText(e.target.value);
                                  if (aiError) setAiError(null);
                                }}
                                placeholder="যেমন: Exclusive Silk Jamdani Saree in Crimson Red with handcrafted gold zari work. Regular price 3500 tk, discount price 2800 tk. Category: Traditional. Available in Red and Maroon. Sizes: Free Size. Limited stock 8 pieces..."
                                className="w-full px-3.5 py-2.5 text-xs bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 shadow-2xs font-normal placeholder:text-slate-400"
                              />

                              {/* Sample Prompts & Generate Button */}
                              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">টেস্টের জন্য স্যাম্পল:</span>
                                  <button
                                    type="button"
                                    onClick={() => setAiRawText('Luxury Crimson Jamdani Saree with pure gold zari work. Regular price 4500 BDT, sale price 3600 BDT. Category: Traditional. Colors: Crimson, Gold. Sizes: Free Size. Stock: 15. Premium festive collection.')}
                                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[11px] font-medium text-indigo-900 transition-colors cursor-pointer"
                                  >
                                    জামদানী শাড়ি
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAiRawText('Royal Designer Embroidered Cotton Panjabi for Men. Price 2200 BDT, regular price 2800 BDT. Category: Panjabi. Sizes: M, L, XL, XXL. Colors: Navy Blue, White, Black. Stock: 20 pieces. Soft breathable fabric for Eid & celebrations.')}
                                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[11px] font-medium text-indigo-900 transition-colors cursor-pointer"
                                  >
                                    পাঞ্জাবি সেট
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAiRawText('Elysian Velvet Evening Gown with crystal sequins. Price 6500 BDT. Regular MRP 8000 BDT. Category: Outerwear. Colors: Emerald, Maroon. Sizes: S, M, L. Stock 5 pcs. Perfect for party & weddings.')}
                                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[11px] font-medium text-indigo-900 transition-colors cursor-pointer"
                                  >
                                    পার্টি গাউন
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  disabled={isAiGenerating}
                                  onClick={handleAiAutoFillProduct}
                                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                >
                                  {isAiGenerating ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>AI জেনারেট হচ্ছে...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>⚡ Auto-Fill Form (অটো-ফিল করুন)</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {aiError && (
                                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span>{aiError}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Row 1: Title, Category, Badge */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                                Product Title (প্রডাক্টের নাম) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={productForm.title}
                                onChange={e => setProductForm({ ...productForm, title: e.target.value })}
                                placeholder="e.g. Royal Jamdani Saree"
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                                Category (ক্যাটাগরি)
                              </label>
                              <select
                                value={productForm.category}
                                onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                              >
                                {allCategories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                                Badge Tag (ট্যাগ / ব্যাজ)
                              </label>
                              <input
                                type="text"
                                value={productForm.badge}
                                onChange={e => setProductForm({ ...productForm, badge: e.target.value })}
                                placeholder="e.g. 20% OFF, Hot, New Arrival"
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                              />
                            </div>
                          </div>

                          {/* Row 2: Pricing & Discount Section */}
                          <div className="p-4 bg-gradient-to-br from-emerald-50/60 to-slate-50 border border-emerald-100 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <Percent className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                  Price & Discount Management (মূল্য ও ডিসকাউন্ট)
                                </span>
                              </div>
                              {productForm.originalPrice && productForm.originalPrice > productForm.price ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  🎉 কাস্টমার ছাড় পাবেন: ৳{(productForm.originalPrice - productForm.price).toLocaleString()} ({Math.round(((productForm.originalPrice - productForm.price) / productForm.originalPrice) * 100)}% OFF)
                                </span>
                              ) : null}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                              <div>
                                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                                  Regular / Original Price (পূর্বের মূল্য ৳)
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={productForm.originalPrice || ''}
                                    onChange={e => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                                    placeholder="e.g. 2500"
                                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-bold"
                                  />
                                </div>
                                <span className="text-[10px] text-slate-500 mt-1 block">ডিসকাউন্টের আগে যে মূল্য ছিল</span>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                                  Selling Price (বিক্রয় মূল্য ৳) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs">৳</span>
                                  <input
                                    type="number"
                                    min="0"
                                    required
                                    value={productForm.price || ''}
                                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                                    placeholder="e.g. 1950"
                                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-extrabold text-emerald-700"
                                  />
                                </div>
                                <span className="text-[10px] text-slate-500 mt-1 block">কাস্টমারকে এই দামে কিনতে হবে</span>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                                  Quick Discount Presets (এক ক্লিকে ডিসকাউন্ট)
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {[5, 10, 15, 20, 25, 30, 50].map(pct => (
                                    <button
                                      key={pct}
                                      type="button"
                                      onClick={() => handleApplyDiscountPercentage(pct)}
                                      className="px-2 py-1 bg-white hover:bg-emerald-600 hover:text-white border border-slate-200 hover:border-emerald-600 rounded-lg text-[11px] font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                                    >
                                      {pct}%
                                    </button>
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-500 mt-1 block">ক্লিক করলেই বিক্রয় মূল্য অটো-ক্যালকুলেট হবে</span>
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Product Images & Gallery Section */}
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                  Product Pictures & Gallery (প্রডাক্টের ছবি ও গ্যালারি)
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {productForm.images?.length || (productForm.image ? 1 : 0)} টি ছবি যুক্ত আছে
                              </span>
                            </div>

                            {/* Action Buttons for Adding Pictures */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* 1. Upload from Device Gallery */}
                              <label className="flex items-center justify-center gap-2.5 p-3.5 bg-white hover:bg-emerald-50/50 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl cursor-pointer transition-all group shadow-2xs text-center">
                                <Upload className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                <div className="text-left">
                                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                                    গ্যালারি বা ডিভাইস থেকে ছবি আপলোড করুন
                                  </div>
                                  <div className="text-[10px] text-slate-500">মোবাইল বা কম্পিউটারের গ্যালারি থেকে সরাসরি ছবি নির্বাচন করুন</div>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleImageFileUpload}
                                  className="hidden"
                                />
                              </label>

                              {/* 2. Choose from Curated Stock Gallery */}
                              <button
                                type="button"
                                onClick={() => setShowCuratedGalleryModal(!showCuratedGalleryModal)}
                                className="flex items-center justify-center gap-2.5 p-3.5 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 rounded-xl cursor-pointer transition-all group shadow-2xs text-center"
                              >
                                <Sparkles className="w-5 h-5 text-amber-500 group-hover:rotate-12 transition-transform" />
                                <div className="text-left">
                                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                                    রেডিমেড ফ্যাশন গ্যালারি থেকে ছবি নিন
                                  </div>
                                  <div className="text-[10px] text-slate-500">শাড়ি, লেহেঙ্গা, পাঞ্জাবি, কোট, ব্যাগ ইত্যাদি প্রিমিয়াম ছবি</div>
                                </div>
                              </button>
                            </div>

                            {isUploadingImage && (
                              <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 rounded-xl text-emerald-700 text-xs font-semibold animate-pulse">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>ছবি আপলোড ও প্রসেসিং হচ্ছে... দয়া করে অপেক্ষা করুন</span>
                              </div>
                            )}

                            {/* Curated Gallery Popover / Drawer */}
                            {showCuratedGalleryModal && (
                              <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-md space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="text-xs font-bold text-slate-800">
                                    হাই-কোয়ালিটি ফ্যাশন স্টক ফটো (ক্লিক করে যুক্ত করুন):
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setShowCuratedGalleryModal(false)}
                                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                  >
                                    ✕ বন্ধ করুন
                                  </button>
                                </div>

                                {/* Category Tabs */}
                                <div className="flex flex-wrap gap-1.5">
                                  {CURATED_GALLERY.map((cat, idx) => (
                                    <button
                                      key={cat.category}
                                      type="button"
                                      onClick={() => setCuratedCategoryIndex(idx)}
                                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        curatedCategoryIndex === idx
                                          ? 'bg-emerald-600 text-white shadow-2xs'
                                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                      }`}
                                    >
                                      {cat.category}
                                    </button>
                                  ))}
                                </div>

                                {/* Photos Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1">
                                  {CURATED_GALLERY[curatedCategoryIndex].photos.map((item, pIdx) => {
                                    const isAdded = (productForm.images || []).includes(item.url) || productForm.image === item.url;
                                    return (
                                      <div
                                        key={pIdx}
                                        onClick={() => handleAddCuratedImage(item.url)}
                                        className={`group relative rounded-lg overflow-hidden border cursor-pointer transition-all aspect-3/4 bg-slate-100 ${
                                          isAdded ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-200 hover:border-emerald-400'
                                        }`}
                                        title={item.title}
                                      >
                                        <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                                          <span className="text-[10px] text-white font-bold">{isAdded ? 'যুক্ত আছে' : '+ যুক্ত করুন'}</span>
                                        </div>
                                        {isAdded && (
                                          <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Or Manual URL Input */}
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={productForm.image}
                                onChange={e => {
                                  const url = e.target.value;
                                  setProductForm(prev => {
                                    const currentImages = prev.images || [];
                                    return {
                                      ...prev,
                                      image: url,
                                      images: url && !currentImages.includes(url) ? [url, ...currentImages] : currentImages
                                    };
                                  });
                                }}
                                placeholder="অথবা সরাসরি ছবির ইমেজ লিংক (URL) পেস্ট করুন..."
                                className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                              />
                            </div>

                            {/* Thumbnails Gallery Strip */}
                            {((productForm.images && productForm.images.length > 0) || productForm.image) && (
                              <div className="space-y-2 pt-2 border-t border-slate-200">
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>সংযুক্ত ছবিসমূহ (ক্লিক করে প্রধান ছবি নির্ধারণ করুন):</span>
                                  <span className="text-emerald-700 font-medium">★ প্রথম ছবি ক্যাটালগ ও কার্ডে দেখাবে</span>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                  {Array.from(new Set([productForm.image, ...(productForm.images || [])].filter(Boolean))).map((imgUrl, idx) => {
                                    const isMain = productForm.image === imgUrl;
                                    return (
                                      <div
                                        key={idx}
                                        className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all group bg-white shadow-2xs ${
                                          isMain ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-slate-200 hover:border-slate-400'
                                        }`}
                                      >
                                        <img src={imgUrl} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                                        
                                        {/* Main Badge */}
                                        {isMain ? (
                                          <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                            প্রধান ছবি
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleSetMainPhoto(imgUrl)}
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 text-white text-[10px] font-bold flex items-center justify-center p-1 transition-opacity cursor-pointer text-center"
                                          >
                                            প্রধান ছবি করুন
                                          </button>
                                        )}

                                        {/* Delete Button */}
                                        <button
                                          type="button"
                                          onClick={() => handleRemovePhoto(imgUrl)}
                                          className="absolute top-1 right-1 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                                          title="Remove photo"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Row 4: Stock, Sizes, Colors */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                                Stock Quantity (স্টক পরিমাণ) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                required
                                value={productForm.stock}
                                onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                                Sizes (সাইজ সমূহ - কমা দিয়ে লিখুন)
                              </label>
                              <input
                                type="text"
                                value={productForm.sizes}
                                onChange={e => setProductForm({ ...productForm, sizes: e.target.value })}
                                placeholder="S, M, L, XL"
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                                Colors (কালার সমূহ - কমা দিয়ে লিখুন)
                              </label>
                              <input
                                type="text"
                                value={productForm.colors}
                                onChange={e => setProductForm({ ...productForm, colors: e.target.value })}
                                placeholder="Maroon, Black, Navy"
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                              />
                            </div>
                          </div>

                          {/* Row 5: Description */}
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                              Product Description (পণ্যের বিবরণ)
                            </label>
                            <textarea
                              rows={3}
                              value={productForm.description}
                              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                              placeholder="প্রিমিয়াম ফ্যাব্রিক, নিখুঁত ডিজাইন ও মার্জিত আউটফিট..."
                              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                            />
                          </div>

                          {/* Submit / Cancel Bar */}
                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(null);
                                setIsAddingProduct(false);
                              }}
                              className="px-5 py-2.5 border border-slate-200 bg-white text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Cancel (বাতিল)
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              <span>{editingProduct ? 'Update Product (সংরক্ষণ করুন)' : 'Publish Product (প্রডাক্ট পাবলিশ করুন)'}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Products Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold sticky top-0 z-10">
                            <tr>
                              <th className="p-3.5">Product</th>
                              <th className="p-3.5">Category</th>
                              <th className="p-3.5">Price & Discount</th>
                              <th className="p-3.5">Stock</th>
                              <th className="p-3.5">Badge</th>
                              <th className="p-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {localProducts
                              .filter(p => !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-3.5 flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                      <img src={p.image} alt={p.title} className="w-11 h-14 object-cover rounded-lg bg-slate-100" />
                                      {p.images && p.images.length > 1 && (
                                        <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-bold px-1 rounded-full">
                                          +{p.images.length - 1}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900">{p.title}</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">ID: {p.id}</div>
                                    </div>
                                  </td>
                                  <td className="p-3.5 text-slate-600 font-medium">{p.category}</td>
                                  <td className="p-3.5">
                                    <div className="font-extrabold text-slate-900 text-sm">৳{p.price.toLocaleString()}</div>
                                    {p.originalPrice && p.originalPrice > p.price && (
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[11px] text-slate-400 line-through">৳{p.originalPrice.toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                                          -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      p.stock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                      {p.stock} in stock
                                    </span>
                                  </td>
                                  <td className="p-3.5">
                                    {p.badge && (
                                      <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                                        {p.badge}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const prodUrl = `${window.location.origin}${window.location.pathname}?product=${p.id}`;
                                        navigator.clipboard?.writeText(prodUrl).then(() => {
                                          setToastMessage(`"${p.title}" এর শেয়ার লিঙ্ক কপি হয়েছে!`);
                                        }).catch(() => {
                                          setToastMessage(`"${p.title}" এর শেয়ার লিঙ্ক কপি হয়েছে!`);
                                        });
                                      }}
                                      className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                      title="প্রডাক্টের শেয়ার লিঙ্ক কপি করুন (Shareable Link)"
                                    >
                                      <Share2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingProduct(p);
                                        setIsAddingProduct(false);
                                        setProductForm({
                                          title: p.title,
                                          price: p.price,
                                          originalPrice: p.originalPrice || p.price,
                                          category: p.category,
                                          image: p.image,
                                          images: p.images && p.images.length > 0 ? p.images : [p.image],
                                          description: p.description,
                                          badge: p.badge || '',
                                          sizes: p.sizes.join(', '),
                                          colors: p.colors.join(', '),
                                          stock: p.stock,
                                          featured: p.featured || false
                                        });
                                      }}
                                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Product"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handlePromptDeleteProduct(p)}
                                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Product (প্রডাক্ট ডিলিট করুন)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CATEGORIES VIEW */}
                {activeTab === 'categories' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">Categories Management (ক্যাটাগরি ব্যবস্থাপনা)</h4>
                        <p className="text-xs text-slate-500">আপনার স্টোরের কালেকশন, মেনু ক্যাটাগরি ও পণ্য গ্রুপ ম্যানেজ ও ডিলিট করুন।</p>
                      </div>
                      <div className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2 self-start sm:self-auto">
                        <FolderTree className="w-4 h-4" />
                        <span>মোট ক্যাটাগরি: {allCategories.length} টি</span>
                      </div>
                    </div>

                    {allCategories.length === 0 ? (
                      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
                        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                          <FolderTree className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-semibold text-slate-600">বর্তমানে কোনো ক্যাটাগরি নেই। নিচের ফরম থেকে নতুন ক্যাটাগরি যোগ করুন।</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allCategories.map(cat => {
                          const count = localProducts.filter(p => p.category === cat).length;
                          return (
                            <div key={cat} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all group">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                  <FolderTree className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-slate-900 text-sm truncate">{cat}</h5>
                                  <span className="text-[11px] text-slate-500 font-medium">{count} products</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                  Active
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handlePromptDeleteCategory(cat)}
                                  className="p-2 text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50/60 rounded-xl transition-all cursor-pointer border border-rose-200 hover:border-rose-600 shadow-2xs flex items-center justify-center"
                                  title={`ক্যাটাগরি "${cat}" ডিলিট করুন`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Category Form */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        <h5 className="font-bold text-slate-900 text-sm">নতুন কালেকশন / ক্যাটাগরি যোগ করুন</h5>
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddCategory(newCategoryName);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          placeholder="যেমন: Footwear, Silk Shawls, Luxury Bags, Hijab..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>যুক্ত করুন</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* 4. ORDERS VIEW WITH DELIVERY BUTTON & STATUS TABS */}
                {activeTab === 'orders' && (() => {
                  const activeAdminOrders = localOrders.filter(o => !o.deletedByAdmin);
                  const archivedAdminOrders = localOrders.filter(o => o.deletedByAdmin);
                  const displayedOrders = orderFilter === 'archived'
                    ? archivedAdminOrders
                    : orderFilter === 'all'
                    ? activeAdminOrders
                    : activeAdminOrders.filter(o => o.status === orderFilter);

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">Customer Orders & Delivery Management (কাস্টমার অর্ডার ও ডেলিভারি)</h4>
                          <p className="text-xs text-slate-500">
                            অর্ডার পর্যবেক্ষণ করুন, 'ডেলিভারি সম্পন্ন' বা 'বাতিল' করুন। অ্যাডমিন প্যানেল থেকে সরালে কাস্টমারের ট্র্যাকিং পেজে তথ্য সংরক্ষিত থাকবে।
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                            মোট একটিভ অর্ডার: {activeAdminOrders.length}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" />
                            <span>ডেলিভারি: {activeAdminOrders.filter(o => o.status === 'Delivered').length}</span>
                          </span>
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 shadow-xs flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>বাতিল: {activeAdminOrders.filter(o => o.status === 'Cancelled').length}</span>
                          </span>
                          {archivedAdminOrders.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setOrderFilter('archived')}
                              className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                              title="প্যানেল থেকে সরানো অর্ডারগুলো দেখুন ও রিস্টোর করুন"
                            >
                              <Archive className="w-3.5 h-3.5 text-amber-600" />
                              <span>সরানো অর্ডার: {archivedAdminOrders.length}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Delivery & Status Filter Tabs */}
                      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                        {[
                          { id: 'all', label: 'All Orders (সবগুলো)', count: activeAdminOrders.length },
                          { id: 'Pending', label: 'Pending (পেন্ডিং)', count: activeAdminOrders.filter(o => o.status === 'Pending').length },
                          { id: 'Processing', label: 'Processing (প্রসেসিং)', count: activeAdminOrders.filter(o => o.status === 'Processing').length },
                          { id: 'Shipped', label: 'Shipped (শিপড)', count: activeAdminOrders.filter(o => o.status === 'Shipped').length },
                          { id: 'Delivered', label: '🚚 Delivered (ডেলিভারি সম্পন্ন)', count: activeAdminOrders.filter(o => o.status === 'Delivered').length, isDeliveryTab: true },
                          { id: 'Cancelled', label: '❌ Cancelled (বাতিল)', count: activeAdminOrders.filter(o => o.status === 'Cancelled').length, isCancelTab: true },
                          { id: 'archived', label: '🗑️ Removed (সরানো অর্ডার)', count: archivedAdminOrders.length, isArchiveTab: true },
                        ].map(tab => {
                          const isActive = orderFilter === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setOrderFilter(tab.id as any)}
                              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isActive
                                  ? tab.isDeliveryTab
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : tab.isCancelTab
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : tab.isArchiveTab
                                    ? 'bg-amber-700 text-white shadow-sm'
                                    : 'bg-slate-900 text-white shadow-sm'
                                  : tab.isDeliveryTab
                                  ? 'text-emerald-800 hover:bg-emerald-100/70 font-bold'
                                  : tab.isCancelTab
                                  ? 'text-rose-700 hover:bg-rose-100/70 font-bold'
                                  : tab.isArchiveTab
                                  ? 'text-amber-800 hover:bg-amber-100 font-bold'
                                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
                              }`}
                            >
                              <span>{tab.label}</span>
                              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : tab.isDeliveryTab
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : tab.isCancelTab
                                  ? 'bg-rose-200 text-rose-900'
                                  : tab.isArchiveTab
                                  ? 'bg-amber-200 text-amber-900'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {tab.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {displayedOrders.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                          {orderFilter === 'Delivered'
                            ? 'কোনো ডেলিভারি সম্পন্ন অর্ডার নেই। অর্ডার কার্ডের "ডেলিভারি সম্পন্ন করুন" বাটনে ক্লিক করে ডেলিভারি লিস্টে যুক্ত করুন।'
                            : orderFilter === 'Cancelled'
                            ? 'কোনো বাতিল অর্ডার নেই। কাস্টমার বা অ্যাডমিন কোনো অর্ডার বাতিল করলে তা এখানে দেখা যাবে।'
                            : orderFilter === 'archived'
                            ? 'অ্যাডমিন প্যানেল থেকে সরানো কোনো অর্ডার নেই।'
                            : 'এই ফিল্টারে কোনো অর্ডার পাওয়া যায়নি।'}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {displayedOrders.map((order, idx) => (
                            <OrderCard
                              key={`${order.id}-${idx}`}
                              order={order}
                              onUpdateStatus={handleOrderStatusUpdate}
                              onMarkDelivered={handleMarkDelivered}
                              onDeleteOrder={handlePromptDeleteOrder}
                              onUpdateTracking={handleUpdateTracking}
                              onRestoreOrder={handleRestoreOrder}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* HOME PAGE BANNERS MANAGEMENT VIEW */}
                {activeTab === 'banners' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-emerald-600" />
                          <span>Home Page Banners (হোম পেজ ব্যানার পরিবর্তন ও এডিট)</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          হোম পেজের প্রধান ব্যানার পরিবর্তন, নতুন ব্যানার যোগ অথবা যেকোনো ব্যানার এডিট করুন।
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBanner(null);
                          setIsAddingBanner(!isAddingBanner);
                          setBannerForm({
                            title: '',
                            subtitle: '',
                            tag: 'Special Offer',
                            image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1600',
                            buttonText: 'Shop Now',
                            link: '#product-grid',
                            active: true
                          });
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/20 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isAddingBanner ? 'Close Form' : 'Add New Banner (নতুন ব্যানার যুক্ত করুন)'}</span>
                      </button>
                    </div>

                    {/* Banner Editor / Creator Form */}
                    {(isAddingBanner || editingBanner) && (
                      <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500/30 shadow-lg space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h5 className="font-bold text-slate-900 text-base flex items-center gap-2">
                              <Edit className="w-4 h-4 text-emerald-600" />
                              <span>{editingBanner ? `Edit Banner: ${editingBanner.title}` : 'নতুন হোম ব্যানার তৈরি করুন'}</span>
                            </h5>
                            <p className="text-xs text-slate-500 mt-0.5">ছবি সিলেক্ট করুন, শিরোনাম ও বাটন টেক্সট লিখুন</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBanner(null);
                              setIsAddingBanner(false);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveBanner} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                ব্যানারের শিরোনাম (Banner Title) *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="যেমন: Summer 2026 Ready-To-Wear"
                                value={bannerForm.title}
                                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                ব্যানার ট্যাগ / ব্যাজ (Tag / Badge)
                              </label>
                              <input
                                type="text"
                                placeholder="যেমন: Exclusive Festive, 50% OFF, New Arrival"
                                value={bannerForm.tag}
                                onChange={(e) => setBannerForm({ ...bannerForm, tag: e.target.value })}
                                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              সাবটাইটেল / বিবরণ (Subtitle / Description)
                            </label>
                            <textarea
                              rows={2}
                              placeholder="ব্যানারের নিচে ছোট বিবরণ..."
                              value={bannerForm.subtitle}
                              onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                বাটন টেক্সট (Button Text)
                              </label>
                              <input
                                type="text"
                                placeholder="যেমন: Explore Collection, Shop Now"
                                value={bannerForm.buttonText}
                                onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                বাটন লিংক / অ্যাকশন (Button Link)
                              </label>
                              <input
                                type="text"
                                placeholder="যেমন: #product-grid"
                                value={bannerForm.link}
                                onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                              />
                            </div>
                          </div>

                          {/* Image Selection & Upload */}
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <label className="block text-xs font-bold text-slate-800">
                              ব্যানার ছবি (Banner Image) *
                            </label>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                              <input
                                type="text"
                                required
                                placeholder="ছবির ডিরেক্ট URL অথবা আপলোড করুন..."
                                value={bannerForm.image}
                                onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                                className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                              />
                              <label className="px-4 py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-2xs">
                                <Upload className="w-4 h-4" />
                                <span>{isUploadingBannerImg ? 'আপলোড হচ্ছে...' : 'গ্যালারি থেকে ছবি আপলোড'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleBannerImgUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {/* Preset luxury banners for quick selection */}
                            <div className="pt-2">
                              <span className="text-[11px] font-bold text-slate-600 block mb-2">
                                রেডিমেড প্রিমিয়াম ফ্যাশন ব্যানার থেকে বেছে নিন (1-Click Select):
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {BANNER_PRESETS.map((preset, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      setBannerForm({
                                        ...bannerForm,
                                        title: preset.title,
                                        subtitle: preset.subtitle,
                                        tag: preset.tag,
                                        image: preset.image,
                                        buttonText: preset.buttonText
                                      });
                                    }}
                                    className="cursor-pointer group relative rounded-xl overflow-hidden border-2 hover:border-emerald-500 transition-all aspect-video shadow-xs"
                                  >
                                    <img src={preset.image} alt={preset.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-end p-1.5">
                                      <span className="text-[10px] font-bold text-white leading-tight truncate">{preset.tag}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Preview */}
                            {bannerForm.image && (
                              <div className="relative rounded-xl overflow-hidden border border-slate-200 h-36 mt-3 bg-slate-900">
                                <img src={bannerForm.image} alt="Preview" className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 p-4 flex flex-col justify-center text-white bg-gradient-to-r from-black/80 via-black/40 to-transparent">
                                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">{bannerForm.tag}</span>
                                  <h6 className="font-bold text-base mt-0.5">{bannerForm.title || "ব্যানারের শিরোনাম"}</h6>
                                  <p className="text-xs text-slate-300 line-clamp-1 mt-1">{bannerForm.subtitle}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={bannerForm.active}
                                onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>হোম পেজে লাইভ প্রদর্শন করুন (Active on Homepage)</span>
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBanner(null);
                                  setIsAddingBanner(false);
                                }}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              >
                                বাতিল (Cancel)
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-900/20 cursor-pointer flex items-center gap-1.5"
                              >
                                <Check className="w-4 h-4" />
                                <span>{editingBanner ? 'ব্যানার আপডেট করুন' : 'ব্যানার সেভ করুন'}</span>
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Existing Banners List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900 text-sm">
                          বর্তমান সক্রিয় ব্যানার তালিকা ({localBanners.length}):
                        </h5>
                        <span className="text-xs text-slate-500">হোম পেজে স্লাইডারে প্রদর্শিত হবে</span>
                      </div>

                      {localBanners.length === 0 ? (
                        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                          <h5 className="font-bold text-slate-800 text-sm">কোনো ব্যানার যুক্ত করা নেই</h5>
                          <p className="text-xs text-slate-500">উপরে 'Add New Banner' বাটনে ক্লিক করে প্রথম ব্যানারটি যুক্ত করুন।</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {localBanners.map((banner) => (
                            <div
                              key={banner.id}
                              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-emerald-300 transition-all"
                            >
                              <div className="relative h-44 bg-slate-900">
                                <img
                                  src={banner.image}
                                  alt={banner.title}
                                  className="w-full h-full object-cover opacity-85"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end text-white">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] bg-black/40 px-2 py-0.5 rounded w-fit">
                                    {banner.tag || 'Special'}
                                  </span>
                                  <h5 className="font-bold text-base mt-1 leading-snug">{banner.title}</h5>
                                  <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{banner.subtitle}</p>
                                </div>
                                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    banner.active !== false 
                                      ? 'bg-emerald-500 text-white' 
                                      : 'bg-slate-700 text-slate-300'
                                  }`}>
                                    {banner.active !== false ? 'Live Active' : 'Hidden'}
                                  </span>
                                </div>
                              </div>

                              <div className="p-4 bg-white flex items-center justify-between gap-3 border-t border-slate-100">
                                <div className="text-xs text-slate-500">
                                  বাটন: <strong className="text-slate-800 font-semibold">{banner.buttonText || 'Shop Now'}</strong>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBanner(banner);
                                      setIsAddingBanner(false);
                                      setBannerForm({
                                        title: banner.title,
                                        subtitle: banner.subtitle || '',
                                        tag: banner.tag || 'Special Offer',
                                        image: banner.image,
                                        buttonText: banner.buttonText || 'Shop Now',
                                        link: banner.link || '#product-grid',
                                        active: banner.active !== false
                                      });
                                    }}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>এডিট করুন</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`আপনি কি ব্যানার "${banner.title}" মুছে ফেলতে চান?`)) {
                                        handleDeleteBanner(banner.id);
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="ব্যানার মুছুন"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PAYMENT SETTINGS & GENERAL STORE SETTINGS VIEW */}
                {activeTab === 'payment_settings' && (
                  <div className="space-y-6 max-w-4xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-emerald-600" />
                          <span>Payment Numbers & Store Settings (বিকাশ, নগদ ও ডেলিভারি সেটিংস)</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          কাস্টমাররা অর্ডার করার সময় যেসব বিকাশ ও নগদ নম্বরে টাকা পাঠাবে তা এখান থেকে পরিবর্তন করুন।
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-900/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSavingSettings ? 'সেভ হচ্ছে...' : 'Save All Settings (সব সেটিংস সেভ করুন)'}</span>
                      </button>
                    </div>

                    {/* 1. bKash Number Configuration Card */}
                    <div className="p-6 bg-white rounded-2xl border-2 border-pink-200/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-pink-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-pink-900/20">
                            bK
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 text-base flex items-center gap-2">
                              <span>bKash (বিকাশ অ্যাকাউন্ট সেটিংস)</span>
                              <span className="text-[10px] bg-pink-100 text-pink-800 font-bold px-2 py-0.5 rounded-full">
                                Active in Checkout
                              </span>
                            </h5>
                            <p className="text-xs text-slate-500">গ্রাহকরা চেকআউটে এই নম্বরে পেমেন্ট করবে</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="px-3.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>বিকাশ নম্বর সেভ</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            বিকাশ নম্বর (bKash Phone Number) *
                          </label>
                          <input
                            type="text"
                            value={localSettings.bkashNumber || ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, bkashNumber: e.target.value })}
                            placeholder="যেমন: 01712-345678"
                            className="w-full px-3.5 py-2.5 text-sm font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            অ্যাকাউন্ট ধরণ (Account Type)
                          </label>
                          <select
                            value={localSettings.bkashType || 'Personal'}
                            onChange={(e) => setLocalSettings({ ...localSettings, bkashType: e.target.value as any })}
                            className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900 cursor-pointer"
                          >
                            <option value="Personal">Personal (পার্সোনাল - Send Money)</option>
                            <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                            <option value="Agent">Agent (এজেন্ট - Cash Out)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 2. Nagad Number Configuration Card */}
                    <div className="p-6 bg-white rounded-2xl border-2 border-orange-200/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-orange-900/20">
                            NG
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 text-base flex items-center gap-2">
                              <span>Nagad (নগদ অ্যাকাউন্ট সেটিংস)</span>
                              <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                                Active in Checkout
                              </span>
                            </h5>
                            <p className="text-xs text-slate-500">গ্রাহকরা চেকআউটে নগদ সিলেক্ট করলে এই নম্বরটি পাবে</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>নগদ নম্বর সেভ</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            নগদ নম্বর (Nagad Phone Number) *
                          </label>
                          <input
                            type="text"
                            value={localSettings.nagadNumber || ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, nagadNumber: e.target.value })}
                            placeholder="যেমন: 01912-345678"
                            className="w-full px-3.5 py-2.5 text-sm font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            অ্যাকাউন্ট ধরণ (Account Type)
                          </label>
                          <select
                            value={localSettings.nagadType || 'Personal'}
                            onChange={(e) => setLocalSettings({ ...localSettings, nagadType: e.target.value as any })}
                            className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 cursor-pointer"
                          >
                            <option value="Personal">Personal (পার্সোনাল - Send Money)</option>
                            <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                            <option value="Agent">Agent (এজেন্ট - Cash Out)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 3. Delivery Charges Configuration Card */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-5 h-5 text-emerald-600" />
                          <h5 className="font-bold text-slate-900 text-base">ডেলিভারি চার্জ কনফিগারেশন (Delivery Charges)</h5>
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          আপডেট করুন
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">চেকআউট পেজে গ্রাহকের জোন অনুযায়ী এই চার্জ অটোমেটিক যোগ হবে</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            ঢাকা সিটির ভিতরে চার্জ (Inside Dhaka Rate)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">৳</span>
                            <input
                              type="number"
                              value={localSettings.deliveryChargeInsideDhaka ?? 80}
                              onChange={(e) => setLocalSettings({ ...localSettings, deliveryChargeInsideDhaka: Number(e.target.value) || 0 })}
                              className="w-full pl-8 pr-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            ঢাকা সিটির বাইরে চার্জ (Outside Dhaka Rate)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">৳</span>
                            <input
                              type="number"
                              value={localSettings.deliveryChargeOutsideDhaka ?? 150}
                              onChange={(e) => setLocalSettings({ ...localSettings, deliveryChargeOutsideDhaka: Number(e.target.value) || 0 })}
                              className="w-full pl-8 pr-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Support Contact Details Card */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-5 h-5 text-emerald-600" />
                          <h5 className="font-bold text-slate-900 text-base">কাস্টমার সাপোর্ট ও হটলাইন (Support Contacts)</h5>
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          আপডেট করুন
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            হটলাইন ফোন নম্বর
                          </label>
                          <input
                            type="text"
                            value={localSettings.contactPhone || ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, contactPhone: e.target.value })}
                            placeholder="+880 1712-345678"
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            সাপোর্ট ইমেইল (Support Email)
                          </label>
                          <input
                            type="email"
                            value={localSettings.contactEmail || ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, contactEmail: e.target.value })}
                            placeholder="support@himayafashion.com"
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            WhatsApp নম্বর (যেমন: 8801712345678)
                          </label>
                          <input
                            type="text"
                            value={localSettings.whatsappNumber || ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                            placeholder="8801712345678"
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Facebook Page URL
                          </label>
                          <input
                            type="url"
                            value={localSettings.facebookUrl || ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, facebookUrl: e.target.value })}
                            placeholder="https://facebook.com/himayafashion"
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 5. Payment Instructions Text */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <label className="block text-xs font-bold text-slate-700">
                        চেকআউটে প্রদর্শিত পেমেন্ট নির্দেশিকা (Payment Instructions for Customer)
                      </label>
                      <textarea
                        rows={2}
                        value={localSettings.paymentInstructions || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, paymentInstructions: e.target.value })}
                        className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* 5. STOCK ALERTS VIEW */}
                {activeTab === 'stock_alerts' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Stock Alerts & Low Inventory</h4>
                      <p className="text-xs text-slate-500">Products with stock at or below 5 units requiring reorder.</p>
                    </div>

                    {lowStockProducts.length === 0 ? (
                      <div className="p-8 bg-white rounded-2xl border border-emerald-200 text-center space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        <h5 className="font-bold text-slate-900 text-sm">All Stock Levels Healthy!</h5>
                        <p className="text-xs text-slate-500">No products are currently critically low on inventory.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {lowStockProducts.map(p => (
                          <div key={p.id} className="p-4 bg-white rounded-2xl border border-rose-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <img src={p.image} alt={p.title} className="w-12 h-14 object-cover rounded-lg bg-slate-100" />
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm">{p.title}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                    {p.stock} units remaining
                                  </span>
                                  <span className="text-xs text-slate-700 font-bold">৳{p.price.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-medium">Quick Restock:</span>
                              <button
                                onClick={() => handleRestock(p.id, 5)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                +5 pcs
                              </button>
                              <button
                                onClick={() => handleRestock(p.id, 10)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                +10 pcs
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. COUPONS VIEW */}
                {activeTab === 'coupons' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">Discount Coupons & Vouchers (ডিসকাউন্ট কুপন ও ভাউচার)</h4>
                        <p className="text-xs text-slate-500">প্রমোশনাল কুপন কোড তৈরি করুন, স্ট্যাটাস পরিবর্তন করুন অথবা প্রয়োজন অনুযায়ী ডিলিট করুন।</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>মোট কুপন: {coupons.length}</span>
                      </span>
                    </div>

                    {coupons.length === 0 ? (
                      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                        <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
                        <h5 className="font-bold text-slate-800 text-sm">কোনো কুপন তৈরি করা নেই</h5>
                        <p className="text-xs text-slate-500">নিচের ফর্মটি ব্যবহার করে প্রথম ডিসকাউন্ট কুপন যুক্ত করুন।</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {coupons.map(cp => (
                          <div key={cp.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 relative group hover:border-emerald-300 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-extrabold text-sm tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                {cp.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleCouponStatus(cp.id)}
                                title="Click to toggle Active / Expired status"
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                                  cp.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-slate-150 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {cp.status}
                              </button>
                            </div>
                            <div>
                              <div className="text-xl font-black text-slate-900">{cp.discount}</div>
                              <div className="text-[11px] text-slate-500">নূন্যতম অর্ডার: ৳{cp.minSpend.toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleCopyCoupon(cp.code)}
                                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>{copiedCoupon === cp.code ? 'Copied!' : 'Copy Code'}</span>
                              </button>
                              <button
                                onClick={() => handlePromptDeleteCoupon(cp)}
                                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                                title="Delete Coupon (কুপন ডিলিট করুন)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Coupon Form */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg space-y-4">
                      <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        <span>নতুন ডিসকাউন্ট কুপন যুক্ত করুন (Add Promo Coupon)</span>
                      </h5>
                      <form onSubmit={handleAddCoupon} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Coupon Code (কুপন কোড)</label>
                          <input
                            type="text"
                            placeholder="e.g. SUMMER25, FLASH50, EID2026"
                            value={newCouponCode}
                            onChange={(e) => setNewCouponCode(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 uppercase font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Discount (ছাড়ের পরিমাণ)</label>
                            <input
                              type="text"
                              placeholder="e.g. 15% OFF or ৳200 OFF"
                              value={newCouponDiscount}
                              onChange={(e) => setNewCouponDiscount(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Min Spend (নূন্যতম খরচ ৳)</label>
                            <input
                              type="number"
                              placeholder="500"
                              value={newCouponMinSpend}
                              onChange={(e) => setNewCouponMinSpend(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Coupon (কুপন যুক্ত করুন)</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* 7. ADS & MONETIZATION MANAGEMENT VIEW */}
                {activeTab === 'ads_promos' && (
                  <div className="space-y-6 max-w-5xl">
                    {/* Header with Master Switch */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 rounded-2xl border border-slate-700 shadow-xl text-white">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                            <Megaphone className="w-5 h-5" />
                          </span>
                          <div>
                            <h4 className="font-bold text-base sm:text-lg">বিজ্ঞাপন ও লিংক কন্ট্রোল (Ads & Monetization)</h4>
                            <p className="text-xs text-slate-300">
                              Adsterra পপআন্ডার, ডিরেক্ট স্মার্টলিংক ও ব্যানার কোড চালু/বন্ধ করুন অথবা নতুন লিংক বসান।
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Global Master Toggle */}
                      <div className="flex items-center gap-3 bg-slate-950/70 px-4 py-2.5 rounded-xl border border-slate-700/80">
                        <div className="text-right">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                            <span className={`w-2 h-2 rounded-full ${localAdConfig.globalAdsEnabled ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                            {localAdConfig.globalAdsEnabled ? 'সব বিজ্ঞাপন চালু' : 'সব বিজ্ঞাপন বন্ধ'}
                          </div>
                          <div className="text-[10px] text-slate-400">Master Ad Switch</div>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleGlobalAds}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            localAdConfig.globalAdsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              localAdConfig.globalAdsEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-slate-500">মোট বিজ্ঞাপন (Total)</div>
                        <div className="text-2xl font-black text-slate-900 mt-1">{localAdConfig.ads.length}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">লিস্টে সেভ করা আছে</div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-emerald-600">চালু আছে (Active)</div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">
                          {localAdConfig.ads.filter(a => a.enabled).length}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">ওয়েবসাইটে শো করছে</div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-purple-600">পপআন্ডার (Popunder)</div>
                        <div className="text-sm font-bold text-slate-800 mt-2 flex items-center gap-1.5">
                          {localAdConfig.ads.some(a => a.type === 'popunder' && a.enabled) ? (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[11px] font-bold">সক্রিয় (Active)</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">বন্ধ (Off)</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 truncate">ক্লিকে নতুন ট্যাব ওপেন</div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-amber-600">ব্যানার কোড (Banner)</div>
                        <div className="text-sm font-bold text-slate-800 mt-2 flex items-center gap-1.5">
                          {localAdConfig.ads.some(a => a.type === 'script_banner' && a.enabled) ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold">160x300 চালু</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">বন্ধ (Off)</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 truncate">সাইটের ভাসমান ব্যানার</div>
                      </div>
                    </div>

                    {/* Toolbar & Controls */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={handleOpenAddAd}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>নতুন বিজ্ঞাপন / লিংক বসান (+ Add Ad)</span>
                        </button>

                        <button
                          onClick={handleResetToAdsterraDefaults}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Adsterra এর দুটি মূল লিংক রিস্টোর করুন"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Adsterra কোড রিস্টোর করুন</span>
                        </button>
                      </div>

                      {/* Cooldown control */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>পপআন্ডার ব্যবধান:</span>
                        <select
                          value={popunderCooldownInput}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 1;
                            setPopunderCooldownInput(val);
                            handleSaveCooldown(val);
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="1">১ মিনিট পর পর (প্রস্তাবিত)</option>
                          <option value="3">৩ মিনিট পর পর</option>
                          <option value="5">৫ মিনিট পর পর</option>
                          <option value="10">১০ মিনিট পর পর</option>
                          <option value="0">প্রতি ক্লিকে (Always)</option>
                        </select>
                      </div>
                    </div>

                    {/* Add / Edit Form Modal/Panel */}
                    {isAddingAd && (
                      <div className="p-6 bg-slate-50 rounded-2xl border-2 border-emerald-500/50 shadow-md space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {editingAd ? 'বিজ্ঞাপন এডিট করুন (Edit Ad)' : 'নতুন বিজ্ঞাপন লিংক বা স্ক্রিপ্ট যুক্ত করুন (Add New Ad)'}
                          </h5>
                          <button
                            onClick={() => {
                              setIsAddingAd(false);
                              setEditingAd(null);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveAdForm} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                বিজ্ঞাপনের নাম (Ad Name / Title) *
                              </label>
                              <input
                                type="text"
                                required
                                value={adForm.name}
                                onChange={(e) => setAdForm({ ...adForm, name: e.target.value })}
                                placeholder="যেমন: Adsterra Popunder Link অথবা 160x300 Banner"
                                className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                বিজ্ঞাপনের ধরন (Ad Type) *
                              </label>
                              <select
                                value={adForm.type}
                                onChange={(e) => {
                                  const newType = e.target.value as AdType;
                                  setAdForm({
                                    ...adForm,
                                    type: newType,
                                    placement: newType === 'popunder' ? 'popunder' : 'floating_corner'
                                  });
                                }}
                                className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                              >
                                <option value="popunder">⚡ Popunder / Direct Smartlink (ইউজার ক্লিকে নতুন ট্যাব)</option>
                                <option value="script_banner">🖼️ Script / Iframe Banner (Adsterra 160x300 ব্যানার কোড)</option>
                                <option value="direct_link">🔗 Direct Sponsor Link (ওয়েবসাইটে স্পন্সর বাটন লিংক)</option>
                              </select>
                            </div>
                          </div>

                          {/* Conditional Inputs based on Type */}
                          {(adForm.type === 'popunder' || adForm.type === 'direct_link') && (
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                বিজ্ঞাপন লিংক (Ad URL / Target Link) *
                              </label>
                              <input
                                type="url"
                                required
                                value={adForm.linkUrl}
                                onChange={(e) => setAdForm({ ...adForm, linkUrl: e.target.value })}
                                placeholder="https://www.profitableratecpmnetwork.com/..."
                                className="w-full p-2.5 text-xs font-mono bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />
                              <p className="text-[11px] text-slate-500 mt-1">
                                ইউজার সাইটে যেকোনো জায়গায় ক্লিক করলে এই লিংকে রিডাইরেক্ট বা নতুন ট্যাবে ওপেন হবে।
                              </p>
                            </div>
                          )}

                          {(adForm.type === 'script_banner' || adForm.type === 'custom_html') && (
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                স্ক্রিপ্ট বা আইফ্রেম কোড (Script / HTML Code) *
                              </label>
                              <textarea
                                rows={5}
                                required
                                value={adForm.scriptCode}
                                onChange={(e) => setAdForm({ ...adForm, scriptCode: e.target.value })}
                                placeholder="<script>atOptions = { ... };</script><script src='https://www.highrevenueformat.com/.../invoke.js'></script>"
                                className="w-full p-2.5 text-xs font-mono bg-slate-900 text-emerald-300 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />
                              <p className="text-[11px] text-slate-500 mt-1">
                                Adsterra, Google AdSense বা যেকোনো অ্যাড নেটওয়ার্কের স্ক্রিপ্ট কোড এখানে পেস্ট করুন। এটি সুরক্ষিত আইফ্রেমে লোড হবে।
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={adForm.enabled}
                                onChange={(e) => setAdForm({ ...adForm, enabled: e.target.checked })}
                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                              />
                              <span className="text-slate-800">এখনই ওয়েবসাইটে চালু রাখুন (Active Now)</span>
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingAd(false);
                                  setEditingAd(null);
                                }}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                              >
                                বাতিল (Cancel)
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{editingAd ? 'আপডেট করুন (Save Changes)' : 'সেভ ও পাবলিশ করুন (Add Ad)'}</span>
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Ads List Card Container */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <span>বিজ্ঞাপনের তালিকা (Configured Ads)</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                            {localAdConfig.ads.length} টি
                          </span>
                        </h5>
                        <span className="text-xs text-slate-500">চালু বা বন্ধ করতে সুইচে ক্লিক করুন</span>
                      </div>

                      {localAdConfig.ads.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                          <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs text-slate-500 font-medium">কোনো বিজ্ঞাপন লিংক বা কোড সেট করা নেই।</p>
                          <button
                            onClick={handleResetToAdsterraDefaults}
                            className="mt-3 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Adsterra ডিফল্ট কোড যুক্ত করুন
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {localAdConfig.ads.map((ad) => (
                            <div
                              key={ad.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                ad.enabled
                                  ? 'bg-white border-slate-200 shadow-xs hover:border-emerald-300'
                                  : 'bg-slate-50/80 border-slate-200/60 opacity-75'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* Left details */}
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h6 className="font-bold text-slate-900 text-sm truncate">{ad.name}</h6>
                                    
                                    {/* Type Badges */}
                                    {ad.type === 'popunder' && (
                                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-extrabold rounded-full">
                                        ⚡ Popunder Direct Link
                                      </span>
                                    )}
                                    {ad.type === 'script_banner' && (
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
                                        🖼️ 160x300 Script Banner
                                      </span>
                                    )}
                                    {ad.type === 'direct_link' && (
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                                        🔗 Direct Sponsor Link
                                      </span>
                                    )}

                                    {/* Status Pill */}
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                      ad.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      {ad.enabled ? '● চালু (ACTIVE)' : '○ বন্ধ (OFF)'}
                                    </span>
                                  </div>

                                  {/* Link / Script preview */}
                                  {ad.linkUrl && (
                                    <div className="flex items-center gap-2 text-xs text-slate-600 truncate pt-0.5">
                                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="font-mono text-[11px] truncate text-slate-700">{ad.linkUrl}</span>
                                      <a
                                        href={ad.linkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700 text-[11px] font-bold flex items-center gap-0.5 shrink-0"
                                      >
                                        টেস্ট করুন <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  )}

                                  {ad.scriptCode && (
                                    <div className="text-[11px] font-mono text-slate-500 bg-slate-100 p-2 rounded-lg line-clamp-1 truncate max-w-xl">
                                      {ad.scriptCode}
                                    </div>
                                  )}
                                </div>

                                {/* Right Action Buttons */}
                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                  {/* Quick Toggle Button */}
                                  <button
                                    onClick={() => handleToggleAd(ad.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                      ad.enabled
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                    title={ad.enabled ? "বিজ্ঞাপনটি বন্ধ করতে ক্লিক করুন" : "বিজ্ঞাপনটি চালু করতে ক্লিক করুন"}
                                  >
                                    {ad.enabled ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>চালু (ON)</span>
                                      </>
                                    ) : (
                                      <>
                                        <X className="w-3.5 h-3.5" />
                                        <span>বন্ধ (OFF)</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Edit Button */}
                                  <button
                                    onClick={() => handleOpenEditAd(ad)}
                                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                    title="এডিট করুন"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => handleDeleteAd(ad.id)}
                                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Live Preview Sandbox for Adsterra 160x300 Banner */}
                    {localAdConfig.ads.some(a => a.type === 'script_banner' && a.enabled) && (
                      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div>
                            <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <span>ব্যানার লাইভ প্রিভিউ (160x300 Live Sandbox Preview)</span>
                            </h5>
                            <p className="text-[11px] text-slate-500">ওয়েবসাইটের ডানদিকের নিচে এই ব্যানারটি লাইভ লোড হচ্ছে।</p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            Sandboxed Iframe
                          </span>
                        </div>

                        <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <div className="w-[160px] h-[300px] bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
                            <iframe
                              title="Admin Ad Preview"
                              srcDoc={`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=160, initial-scale=1.0" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 160px;
        height: 300px;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    ${localAdConfig.ads.find(a => a.type === 'script_banner' && a.enabled)?.scriptCode || ''}
  </body>
</html>`}
                              className="w-[160px] h-[300px] border-0"
                              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Storefront Top Announcement Bar Section */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">ওয়েবসাইটের শীর্ষ ঘোষণা বার (Top Announcement Bar)</h5>
                          <p className="text-xs text-slate-500">ওয়েবসাইটের একবারে শীর্ষে প্রমোশনাল অফার বা নোটিশ টেক্সট প্রদর্শন করুন।</p>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isPromoActive} 
                            onChange={(e) => setIsPromoActive(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4" 
                          />
                          <span>ওয়েবসাইটে সক্রিয়</span>
                        </label>
                      </div>

                      <textarea
                        rows={2}
                        value={promoMessage}
                        onChange={(e) => setPromoMessage(e.target.value)}
                        placeholder="যেমন: ✨ Special Eid Offer: Free Nationwide Express Shipping on Orders Over ৳2,000!"
                        className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                      />

                      <div className="flex items-center justify-between">
                        <button
                          onClick={async () => {
                            try {
                              const updated = {
                                ...localSettings,
                                announcementText: promoMessage,
                                isAnnouncementActive: isPromoActive
                              };
                              setLocalSettings(updated);
                              if (onUpdateStoreSettings) {
                                onUpdateStoreSettings(updated);
                              }
                              await saveStoreSettings(updated);
                              setPromoSavedAlert(true);
                              setTimeout(() => setPromoSavedAlert(false), 2500);
                            } catch (err) {
                              console.error('Error saving announcement:', err);
                            }
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>ঘোষণা সেভ করুন (Save Announcement)</span>
                        </button>
                        {promoSavedAlert && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <Check className="w-4 h-4" /> সফলভাবে সেভ হয়েছে!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. REVIEWS VIEW */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Customer Reviews & Ratings</h4>
                      <p className="text-xs text-slate-500">Moderated verified customer feedback and star ratings.</p>
                    </div>

                    <div className="space-y-3">
                      {reviews.map(rv => (
                        <div key={rv.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{rv.author}</span>
                              <span className="text-[11px] text-slate-400">&middot; {rv.date}</span>
                            </div>
                            <div className="flex items-center text-amber-400">
                              {[...Array(rv.rating)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600">{rv.comment}</p>
                          <div className="pt-2 flex items-center justify-between text-[11px]">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                              {rv.status}
                            </span>
                            <button
                              onClick={() => setReviews(prev => prev.filter(r => r.id !== rv.id))}
                              className="text-slate-400 hover:text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 9. SETTINGS VIEW */}
                {activeTab === 'settings' && (
                  <div className="space-y-6 max-w-3xl">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Website Settings & Quick Edits (ওয়েবসাইট সেটিংস ও দ্রুত এডিট)</h4>
                      <p className="text-xs text-slate-500">হোম ব্যানার, বিকাশ/নগদ পেমেন্ট নম্বর, ডেলিভারি চার্জ এবং অন্যান্য কনফিগারেশন এডিট করুন।</p>
                    </div>

                    {/* Quick Edit Action Buttons (User Requested Feature) */}
                    <div className="p-6 bg-white rounded-2xl border-2 border-emerald-500/20 shadow-xs space-y-4">
                      <div className="flex items-center gap-2">
                        <Edit className="w-5 h-5 text-emerald-600" />
                        <h5 className="font-bold text-slate-900 text-base">Quick Edit Controls (দ্রুত এডিট বাটনসমূহ)</h5>
                      </div>
                      <p className="text-xs text-slate-600">
                        নিচের যেকোনো বাটনে ক্লিক করে সরাসরি প্রয়োজনীয় সেটিং অথবা কনটেন্ট এডিট করুন:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab('banners')}
                          className="p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                                হোম পেজ ব্যানার এডিট
                              </div>
                              <div className="text-[10px] text-slate-500">ব্যানার ইমেজ, টাইটেল ও লিংক পরিবর্তন</div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">এডিট &rarr;</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('payment_settings')}
                          className="p-3.5 bg-slate-50 hover:bg-pink-50 border border-slate-200 hover:border-pink-300 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
                              bK
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 group-hover:text-pink-700">
                                বিকাশ ও নগদ নম্বর এডিট
                              </div>
                              <div className="text-[10px] text-slate-500">পেমেন্ট ফোন নম্বর ও অ্যাকাউন্ট টাইপ</div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-pink-600 group-hover:translate-x-0.5 transition-transform">এডিট &rarr;</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('payment_settings')}
                          className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                                ডেলিভারি চার্জ এডিট
                              </div>
                              <div className="text-[10px] text-slate-500">ঢাকার ভিতরে (৳৮০) ও বাইরে (৳১৫০)</div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">এডিট &rarr;</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('products')}
                          className="p-3.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                                প্রডাক্ট ও স্টক এডিট
                              </div>
                              <div className="text-[10px] text-slate-500">প্রডাক্ট যোগ, দাম ও ছবি পরিবর্তন</div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-purple-600 group-hover:translate-x-0.5 transition-transform">এডিট &rarr;</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('coupons')}
                          className="p-3.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                              <Ticket className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                                কুপন ও ভাউচার এডিট
                              </div>
                              <div className="text-[10px] text-slate-500">ডিসকাউন্ট কোড তৈরি ও ডিলিট</div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform">এডিট &rarr;</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('ads_promos')}
                          className="p-3.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                              <Megaphone className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700">
                                টপ অ্যানাউন্সমেন্ট এডিট
                              </div>
                              <div className="text-[10px] text-slate-500">ওয়েবসাইটের শীর্ষ অফার বার্তা</div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-teal-600 group-hover:translate-x-0.5 transition-transform">এডিট &rarr;</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('app_install')}
                          className="p-3.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group sm:col-span-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                              <Download className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                                "Download apps" কন্ট্রোল ও ফাইল আপলোড
                              </div>
                              <div className="text-[10px] text-slate-500">
                                ইচ্ছামতো যেকোনো ফাইল (.apk, .zip, etc.) আপলোড ও ওয়েবসাইটের টপ-বারে বাটন প্রদর্শন করুন
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">কনফিগার &rarr;</span>
                        </button>
                      </div>
                    </div>

                    {/* Download Packages & Netlify Deploy Card */}
                    <div className="p-6 bg-white rounded-2xl border border-emerald-500/30 shadow-sm space-y-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h5 className="font-bold text-slate-900 text-base">ফুল সোর্স কোড ও Netlify ডিপ্লয় প্যাকেজ (Source & Netlify Deployment)</h5>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          প্রজেক্টের <strong>সকল নতুন আপডেটসহ সম্পূর্ণ সোর্স কোড ও প্রি-বিল্ড প্যাকেজ</strong> ডাউনলোড করুন। আপনি এটি সরাসরি Netlify, Vercel বা যেকোনো সার্ভারে চালাতে পারবেন।
                        </p>
                      </div>

                      {/* Two Download Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Option 1: Full Source Package */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                              <Download className="w-4 h-4 text-emerald-600" />
                              <span>১. সম্পূর্ণ সোর্স কোড (Full Source .zip)</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                              এতে ফ্রন্টএন্ড, ব্যাকএন্ড (<code className="text-slate-700">server.ts</code>), <code className="text-slate-700">netlify.toml</code>, এবং বিল্ড করা <code className="text-slate-700">dist/</code> ফোল্ডারসহ সকল ফাইল অন্তর্ভুক্ত। GitHub বা কোড এডিটের জন্য আদর্শ।
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleDownloadSource}
                            disabled={isDownloadingSource}
                            className={`px-4 py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                              isDownloadingSource
                                ? 'bg-slate-700 cursor-not-allowed opacity-80'
                                : 'bg-slate-900 hover:bg-emerald-600'
                            }`}
                          >
                            {isDownloadingSource ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                                <span>প্যাকেজ প্রস্তুত হচ্ছে...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Download Full Source (.zip)</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Option 2: Netlify Ready Package */}
                        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                              <Globe className="w-4 h-4 text-emerald-600" />
                              <span>২. নেটলিফাই রেডি প্যাকেজ (Netlify Ready .zip)</span>
                              <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-800 text-[9px] font-extrabold rounded">সরাসরি ড্রপ</span>
                            </div>
                            <p className="text-[11px] text-emerald-900/80 mt-1 leading-normal">
                              এটি সরাসরি Netlify-র জন্য তৈরি প্রি-বিল্ড প্যাকেজ। এটি ডাউনলোড করে আনজিপ করুন, তারপর ভেতরের ফাইলগুলো <code className="text-emerald-800 font-semibold">app.netlify.com/drop</code>-এ টেনে দিন—কোনো সাদা স্ক্রিন আসবে না!
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleDownloadNetlifyPackage}
                            disabled={isDownloadingNetlify}
                            className={`px-4 py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                              isDownloadingNetlify
                                ? 'bg-slate-700 cursor-not-allowed opacity-80'
                                : 'bg-emerald-700 hover:bg-emerald-800'
                            }`}
                          >
                            {isDownloadingNetlify ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                                <span>Netlify প্যাকেজ হচ্ছে...</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-3.5 h-3.5 text-white" />
                                <span>Download Netlify Ready (.zip)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Step by step Netlify instructions */}
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Netlify-তে সাদা স্ক্রিন (Blank Screen) এড়ানোর সঠিক নিয়ম:</span>
                        </div>
                        <ol className="list-decimal list-inside text-[11px] space-y-0.5 pl-1 text-amber-800">
                          <li><strong>পদ্ধতি ১ (Netlify Drop):</strong> ওপরের সবুজ <em>Netlify Ready (.zip)</em> ডাউনলোড করে আনজিপ করুন। এরপর <a href="https://app.netlify.com/drop" target="_blank" rel="noreferrer" className="underline font-bold text-amber-900">app.netlify.com/drop</a>-এ ফোল্ডারটি ছেড়ে দিন।</li>
                          <li><strong>পদ্ধতি ২ (GitHub Deploy):</strong> Full Source কোড দিয়ে GitHub-এ তুললে প্রজেক্টের <code className="font-mono bg-amber-100 px-1 rounded">netlify.toml</code> ফাইলটি স্বয়ংক্রিয়ভাবে বিল্ড পরিচালনা করবে।</li>
                        </ol>
                      </div>
                    </div>

                    {/* System Information */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current System Version</div>
                          <div className="text-xl font-black text-slate-900 mt-0.5">
                            {versionInfo ? versionInfo.version : 'v1.4.2'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                          <span>System Active</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {versionInfo?.changelog || "All static asset folders and database records are synchronized for seamless management."}
                      </p>

                      <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        <div className="flex justify-between py-1">
                          <span className="font-medium text-slate-500">Store Name:</span>
                          <span className="font-bold text-slate-900">Himaya Fashion &middot; Luxury Couture</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="font-medium text-slate-500">Default Currency:</span>
                          <span className="font-bold text-slate-900">BDT (৳)</span>
                        </div>
                        <div className="flex justify-between py-1 items-center">
                          <span className="font-medium text-slate-500">Database Engine:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-600">Cloud Firestore Active</span>
                            {onOpenFirebaseGuide && (
                              <button
                                onClick={onOpenFirebaseGuide}
                                className="text-[10px] text-emerald-600 hover:text-emerald-700 underline font-semibold cursor-pointer"
                              >
                                View Guide
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Authorized Admin Gmail Permissions */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <span>অ্যাডমিন জিমেইল পারমিশন (Admin Permissions)</span>
                          </h5>
                          <p className="text-xs text-slate-500 mt-0.5">
                            যেসব জিমেইল একাউন্ট দিয়ে লগইন করলে অ্যাডমিন প্যানেল দৃশ্যমান হবে তাদের তালিকা। কাস্টমারদের জন্য এই প্যানেল সম্পূর্ণ গোপন থাকবে।
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        {adminEmails.map(email => (
                          <div key={email} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="font-mono font-bold text-slate-800">{email}</span>
                              {email === 'mhemal136@gmail.com' && (
                                <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-300">
                                  মূল সুপার অ্যাডমিন (Super Admin)
                                </span>
                              )}
                            </div>
                            {email !== 'mhemal136@gmail.com' && onUpdateAdminEmails && (
                              <button
                                onClick={async () => {
                                  const updated = adminEmails.filter(e => e !== email);
                                  await onUpdateAdminEmails(updated);
                                  setToastMessage(`অ্যাডমিন পারমিশন রিমুভ করা হয়েছে: ${email}`);
                                }}
                                className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                              >
                                রিমুভ
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add another admin email form */}
                      {onUpdateAdminEmails && (
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                          <input
                            type="email"
                            placeholder="নতুন অ্যাডমিন জিমেইল লিখুন (e.g. manager@gmail.com)"
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const trimmed = newAdminEmail.trim().toLowerCase();
                              if (!trimmed || !trimmed.includes('@')) {
                                setAdminEmailMsg('সঠিক জিমেইল অ্যাড্রেস লিখুন');
                                return;
                              }
                              if (adminEmails.includes(trimmed)) {
                                setAdminEmailMsg('এই ইমেইল ইতিমধ্যে তালিকায় রয়েছে');
                                return;
                              }
                              const updated = [...adminEmails, trimmed];
                              await onUpdateAdminEmails(updated);
                              setNewAdminEmail('');
                              setAdminEmailMsg('');
                              setToastMessage(`নতুন অ্যাডমিন জিমেইল যুক্ত করা হয়েছে: ${trimmed}`);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            + যুক্ত করুন
                          </button>
                        </div>
                      )}
                      {adminEmailMsg && <p className="text-[11px] text-rose-500 font-medium">{adminEmailMsg}</p>}
                    </div>

                  </div>
                )}

                {/* 11. DOWNLOAD APPS & CUSTOM FILE UPLOAD VIEW */}
                {activeTab === 'app_install' && (
                  <div className="space-y-6 max-w-4xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                          <Download className="w-3.5 h-3.5 text-amber-600" />
                          <span>Download Apps Management & File Upload</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xl">
                          "Download apps" কন্ট্রোল ও ফাইল আপলোড প্যানেল
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ওয়েবসাইটের উপরের অংশে প্রদর্শিত <strong>"Download apps"</strong> বাটনের জন্য আপনার পছন্দমতো যেকোনো ফাইল আপলোড করুন ও ডাউনলোড লিঙ্ক নিয়ন্ত্রণ করুন।
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        {isSavingSettings ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>সেভ হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-white" />
                            <span>কনফিগারেশন সেভ করুন</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Visibility Switch */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>ওয়েবসাইটের উপরে "Download apps" বাটন ভিজিবিলিটি</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            localSettings.isAppDownloadEnabled !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {localSettings.isAppDownloadEnabled !== false ? 'সক্রিয় (Active)' : 'লুকায়িত (Hidden)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          ওয়েবসাইটের শীর্ষ ন্যাভিগেশন বার, মোবাইল মেনু এবং ব্যানারে "Download apps" বাটন প্রদর্শন করবেন কিনা তা নিয়ন্ত্রণ করুন।
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={localSettings.isAppDownloadEnabled !== false}
                          onChange={(e) => setLocalSettings({ ...localSettings, isAppDownloadEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    {/* Button Text Customization */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          ওয়েবসাইটে প্রদর্শিত বাটন টেক্সট (Button Display Label) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={localSettings.appButtonText || 'Download apps'}
                          onChange={(e) => setLocalSettings({ ...localSettings, appButtonText: e.target.value })}
                          placeholder="Download apps"
                          className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] text-slate-900 font-bold"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          ওয়েবসাইটের টপ-বার ও হেডারে এই লেখাটি প্রদর্শিত হবে (যেমন: <strong>Download apps</strong>)।
                        </p>
                      </div>
                    </div>

                    {/* Direct File Upload (Admin's Choice of File) */}
                    <div className="p-6 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 text-base">
                              অ্যাডমিনের ইচ্ছামতো ফাইল আপলোড (Upload Any App File)
                            </h5>
                            <p className="text-xs text-slate-500">
                              আপনার কম্পিউটার বা ফোন থেকে যেকোনো ফাইল (যেমন: <code>.apk</code>, <code>.zip</code>, <code>.aab</code>, <code>.ipa</code>) সরাসরি আপলোড করতে পারবেন।
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="relative border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 rounded-2xl p-6 text-center transition-all">
                        <input
                          type="file"
                          onChange={handleUploadAppFile}
                          disabled={isUploadingAppFile}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          id="appCustomFileInput"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                          {isUploadingAppFile ? (
                            <>
                              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                              <div className="text-xs font-bold text-emerald-800">{appFileUploadProgress || "ফাইল আপলোড হচ্ছে..."}</div>
                              <div className="text-[10px] text-slate-500">দয়া করে ফাইল আপলোড শেষ হওয়া পর্যন্ত অপেক্ষা করুন...</div>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-emerald-200 flex items-center justify-center text-emerald-600">
                                <Download className="w-6 h-6" />
                              </div>
                              <div className="text-sm font-bold text-slate-900">
                                ক্লিক করে আপনার পছন্দের ফাইলটি সিলেক্ট ও আপলোড করুন
                              </div>
                              <p className="text-xs text-slate-500">
                                ফাইলটি স্বয়ংক্রিয়ভাবে সার্ভারের <code>/uploads/</code> ডিরেক্টরিতে সেভ হবে এবং ডাউনলোড লিঙ্কে যুক্ত হবে।
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Download URL / External Link Setting */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div>
                        <h5 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-[#C5A059]" />
                          <span>ফাইল ডাউনলোড লিঙ্ক ও বিবরণ (File URL & App Info)</span>
                        </h5>
                        <p className="text-xs text-slate-500 mt-0.5">
                          সরাসরি আপলোডকৃত ফাইলের লিঙ্ক অথবা যেকোনো এক্সটার্নাল ড্রাইভ লিঙ্ক (Google Drive, Dropbox, CDN) ব্যবহার করতে পারেন।
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* URL input */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            ডাউনলোড লিঙ্ক (Download URL / Path) <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={localSettings.appApkUrl || ''}
                              onChange={(e) => setLocalSettings({ ...localSettings, appApkUrl: e.target.value })}
                              placeholder="/uploads/himaya-fashion.apk অথবা https://drive.google.com/..."
                              className="flex-1 px-4 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-bold"
                            />
                            {localSettings.appApkUrl && (
                              <a
                                href={localSettings.appApkUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2.5 bg-slate-900 hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                                title="টেস্ট ডাউনলোড"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>টেস্ট ডাউনলোড</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Version and File Size */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                              অ্যাপ ভার্সন (Version Name)
                            </label>
                            <input
                              type="text"
                              value={localSettings.appApkVersion || ''}
                              onChange={(e) => setLocalSettings({ ...localSettings, appApkVersion: e.target.value })}
                              placeholder="e.g. v1.2.0"
                              className="w-full px-4 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                              ফাইলের সাইজ (File Size)
                            </label>
                            <input
                              type="text"
                              value={localSettings.appApkSize || ''}
                              onChange={(e) => setLocalSettings({ ...localSettings, appApkSize: e.target.value })}
                              placeholder="e.g. 16.8 MB"
                              className="w-full px-4 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-bold"
                            />
                          </div>
                        </div>

                        {/* Download Note */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            অ্যাপের বিবরণ বা বার্তা (App Description / Note)
                          </label>
                          <textarea
                            rows={2}
                            value={localSettings.appDownloadNotes || ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, appDownloadNotes: e.target.value })}
                            placeholder="Official Himaya Fashion Android App. Instant shopping, push order updates & exclusive member offers."
                            className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Save Action */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSavingSettings ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>সেটিংস সেভ হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-white" />
                            <span>কনফিগারেশন সংরক্ষণ করুন (Save Settings)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </main>
          </>
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-fade-in text-xs max-w-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="flex-1">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* In-App Guaranteed Deletion Confirmation Modal */}
        {deleteModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
              <div className={`w-12 h-12 ${deleteModal.isPermanentOrder ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-100 text-rose-600'} rounded-full flex items-center justify-center mx-auto shadow-sm`}>
                {deleteModal.isPermanentOrder ? <AlertTriangle className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-base font-bold text-slate-900">
                  {deleteModal.type === 'product' 
                    ? 'প্রডাক্ট ডিলিট নিশ্চিত করুন' 
                    : deleteModal.type === 'coupon'
                      ? 'ডিসকাউন্ট কুপন ডিলিট নিশ্চিত করুন'
                      : deleteModal.type === 'category'
                        ? 'ক্যাটাগরি ডিলিট নিশ্চিত করুন'
                        : deleteModal.isPermanentOrder
                          ? 'অর্ডার স্থায়ীভাবে মুছে ফেলা (Permanent Delete)'
                          : 'অর্ডার অ্যাডমিন প্যানেল থেকে সরানো'}
                </h4>
                {deleteModal.type === 'category' ? (
                  <div className="text-xs text-slate-600 space-y-2.5">
                    <p>
                      আপনি কি নিশ্চিতভাবে ক্যাটাগরি <strong className="text-rose-600">"{deleteModal.title}"</strong> ডিলিট করতে চান?
                    </p>
                    {deleteModal.categoryProductCount && deleteModal.categoryProductCount > 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-left space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>সতর্কতা: এতে {deleteModal.categoryProductCount} টি পণ্য রয়েছে</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-800">
                          ক্যাটাগরি ডিলিট করলে এই {deleteModal.categoryProductCount} টি পণ্য ডিলিট হবে না, সেগুলো স্বয়ংক্রিয়ভাবে <strong className="text-slate-900">'General'</strong> ক্যাটাগরিতে স্থানান্তরিত হবে এবং ক্যাটাগরি তালিকা থেকে এটি সম্পূর্ণ মুছে যাবে।
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-left space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-slate-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>এই ক্যাটাগরিতে কোনো পণ্য নেই</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          এটি নিরাপদে ক্যাটাগরি তালিকা ও ফিল্টার থেকে চিরতরে মুছে যাবে।
                        </p>
                      </div>
                    )}
                  </div>
                ) : deleteModal.type === 'order' ? (
                  deleteModal.isPermanentOrder ? (
                    <div className="text-xs text-slate-600 space-y-2.5">
                      <p>
                        আপনি কি নিশ্চিতভাবে সরানো অর্ডার <strong className="text-rose-600">"{deleteModal.title}"</strong> ডাটাবেস থেকে স্থায়ীভাবে চিরতরে ডিলিট করতে চান?
                      </p>
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-left space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-rose-900">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>সতর্কতা: এটি আর ফিরিয়ে আনা যাবে না</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-rose-700">
                          এই অর্ডারটি ফায়ারস্টোর ডাটাবেস ও সিস্টেম থেকে চিরতরে মুছে যাবে।
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 space-y-2.5">
                      <p>
                        আপনি কি নিশ্চিতভাবে অর্ডার <strong className="text-slate-900">"{deleteModal.title}"</strong> অ্যাডমিন প্যানেল থেকে সরাতে চান?
                      </p>
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-left space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>কাস্টমারের তথ্য সুরক্ষিত থাকবে</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-emerald-700">
                          গ্রাহকের এখান থেকে অর্ডার কাটবে না। গ্রাহক তার ট্র্যাকিং পেজে অর্ডার দেখতে পাবেন। অ্যাডমিন প্যানেলের 'সরানো অর্ডার' ট্যাব থেকে চাইলে এটি যেকোনো সময় পুনরায় ফিরিয়ে আনা যাবে অথবা চিরতরে ডিলিট করা যাবে।
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-xs text-slate-600">
                    আপনি কি নিশ্চিতভাবে <strong className="text-slate-900">"{deleteModal.title}"</strong> ডিলিট করতে চান? এটি চিরতরে মুছে যাবে।
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer ${
                    deleteModal.isPermanentOrder ? 'bg-rose-700 hover:bg-rose-800 ring-2 ring-rose-300' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {deleteModal.type === 'order' 
                    ? (deleteModal.isPermanentOrder ? 'স্থায়ীভাবে ডিলিট করুন' : 'প্যানেল থেকে সরান')
                    : deleteModal.type === 'category'
                    ? 'ক্যাটাগরি ডিলিট করুন'
                    : 'নিশ্চিত ডিলিট করুন'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
