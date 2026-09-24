import React, { useState } from 'react';
import { Order } from '../types';
import { Search, X, Truck, Package, ExternalLink, CheckCircle2, Clock, MapPin, Phone, User, ShieldCheck, XCircle, AlertCircle } from 'lucide-react';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose, orders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    const results = orders.filter(o => 
      o.id.toLowerCase().includes(q) || 
      o.phone.includes(q) ||
      o.email.toLowerCase().includes(q)
    );
    setMatchedOrders(results);
    setSearched(true);
  };

  const getStatusStep = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 1;
      case 'Processing': return 2;
      case 'Shipped': return 3;
      case 'Delivered': return 4;
      default: return 1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1A1A1A] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">Order Live Tracking (অর্ডার লাইভ ট্র্যাকিং)</h3>
              <p className="text-[11px] text-[#A39E93]">Enter your Order ID or Phone Number to check live location & delivery status.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF9F6]">
          
          {/* Search Box */}
          <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-[#E6E2DD] shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase text-[#1A1A1A]">
              Search Order ID or Phone Number (অর্ডার আইডি বা মোবাইল নম্বর দিন)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. ORD-482910 or 01712345678"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#FAF9F6] border border-[#E6E2DD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059] font-mono text-[#1A1A1A]"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-[#888]" />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track (ট্র্যাক করুন)</span>
              </button>
            </div>
          </form>

          {/* Results Section */}
          {searched && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-[#666]">
                Search results for &quot;{searchQuery}&quot;: found {matchedOrders.length} order(s).
              </div>

              {matchedOrders.length === 0 ? (
                <div className="p-8 bg-white rounded-xl border border-[#E6E2DD] text-center space-y-2">
                  <Package className="w-10 h-10 text-[#C5A059] mx-auto opacity-60" />
                  <h4 className="font-serif font-bold text-sm text-[#1A1A1A]">কোনো অর্ডার পাওয়া যায়নি</h4>
                  <p className="text-xs text-[#666]">আপনার সঠিক অর্ডার আইডি (যেমন: ORD-123456) অথবা অর্ডার করার সময় দেওয়া মোবাইল নম্বরটি দিয়ে পুনরায় চেষ্টা করুন।</p>
                </div>
              ) : (
                matchedOrders.map((order, idx) => {
                  const step = getStatusStep(order.status);
                  return (
                    <div key={`${order.id}-${idx}`} className="bg-white rounded-xl border border-[#E6E2DD] shadow-xs p-5 space-y-4">
                      
                      {/* Top bar */}
                      <div className="flex flex-wrap items-center justify-between border-b border-[#E6E2DD] pb-3 gap-2">
                        <div>
                          <span className="font-mono font-extrabold text-sm text-[#1A1A1A]">Order #{order.id}</span>
                          <span className="block text-[10px] text-[#888]">Placed on: {new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          order.status === 'Cancelled' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          order.status === 'Processing' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 
                          'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}>
                          {order.status === 'Cancelled' ? '🚫 Cancelled (বাতিল)' : order.status}
                        </span>
                      </div>

                      {/* Cancelled Notice or Visual Progress Steps */}
                      {order.status === 'Cancelled' ? (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>অর্ডারটি বাতিল (Cancelled) করা হয়েছে</span>
                          </div>
                          <p className="text-xs text-rose-700 leading-relaxed">
                            {order.cancelledReason || 'এই অর্ডারটি অ্যাডমিন বা সাপোর্ট টিম কর্তৃক বাতিল করা হয়েছে। এটি আপনার ট্র্যাক রেকর্ডে সংরক্ষিত থাকবে। কোনো প্রশ্ন বা সহায়তার জন্য আমাদের হেল্পলাইনে যোগাযোগ করুন।'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {[
                            { title: 'Pending', desc: 'Order received' },
                            { title: 'Processing', desc: 'Packing item' },
                            { title: 'Shipped', desc: 'Handed to courier' },
                            { title: 'Delivered', desc: 'Delivered to you' },
                          ].map((s, idx) => {
                            const isDone = step >= idx + 1;
                            const isCurrent = step === idx + 1;
                            return (
                              <div key={s.title} className="text-center space-y-1">
                                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDone ? 'bg-[#C5A059] text-white shadow-xs' : 'bg-[#FAF9F6] text-[#888] border border-[#E6E2DD]'
                                }`}>
                                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                </div>
                                <div className={`text-[11px] font-bold ${isCurrent ? 'text-[#C5A059]' : 'text-[#1A1A1A]'}`}>{s.title}</div>
                                <div className="text-[9px] text-[#888] hidden sm:block">{s.desc}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Courier & Live Tracking Info Card (If added by Admin) */}
                      {(order.courierName || order.trackingNumber || order.trackingUrl) && (
                        <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#C5A059]/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-[#C5A059]" />
                              <span className="font-bold text-xs text-[#1A1A1A]">Courier & Live Tracking Details</span>
                            </div>
                            <span className="text-[10px] font-bold bg-[#C5A059] text-white px-2 py-0.5 rounded">
                              {order.courierName || 'Courier Partner'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#666]">
                            {order.trackingNumber && (
                              <div><strong className="text-[#1A1A1A]">Tracking Number:</strong> <span className="font-mono">{order.trackingNumber}</span></div>
                            )}
                            {order.trackingNotes && (
                              <div><strong className="text-[#1A1A1A]">Courier Status / Note:</strong> {order.trackingNotes}</div>
                            )}
                          </div>

                          {order.trackingUrl && (
                            <div className="pt-1">
                              <a
                                href={order.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#C5A059] hover:bg-[#b08d48] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                              >
                                <span>কুরিয়ার ওয়েবসাইট থেকে লাইভ ট্র্যাক করুন (Live Track on Courier)</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Customer & Delivery Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#666] bg-[#FAF9F6] p-3 rounded-xl border border-[#E6E2DD]">
                        <div><strong className="text-[#1A1A1A]">Customer:</strong> {order.customerName}</div>
                        <div><strong className="text-[#1A1A1A]">Phone:</strong> {order.phone}</div>
                        <div><strong className="text-[#1A1A1A]">Delivery Area:</strong> {order.deliveryArea || 'Inside Dhaka'} (৳{order.deliveryCharge || 80})</div>
                        <div><strong className="text-[#1A1A1A]">Address:</strong> {order.address}, {order.thana ? `${order.thana}, ${order.district}, ${order.division || ''}` : order.city}</div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-bold text-[#1A1A1A]">Ordered Items ({order.items.length}):</div>
                        <div className="space-y-1.5">
                          {order.items.map((item, i) => (
                            <div key={`${order.id}-item-${i}`} className="flex items-center justify-between text-xs bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E6E2DD] gap-3">
                              <div className="flex items-center gap-2.5">
                                {item.image && (
                                  <img src={item.image} alt={item.title} className="w-10 h-12 object-cover rounded border border-slate-200 shrink-0" />
                                )}
                                <div>
                                  <span className="font-bold text-[#1A1A1A] block line-clamp-1">{item.title}</span>
                                  <span className="text-[#666] text-[11px]">
                                    রং: <strong className="text-slate-800">{item.color}</strong> &middot; সাইজ: <strong className="text-slate-800">{item.size}</strong> &middot; Qty: {item.quantity}
                                  </span>
                                </div>
                              </div>
                              <span className="font-semibold text-[#1A1A1A] shrink-0">৳{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#E6E2DD] text-sm font-bold text-[#1A1A1A]">
                          <span>Total Amount (সহ মোট):</span>
                          <span className="text-[#C5A059]">৳{order.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-[#E6E2DD] flex justify-between items-center text-xs text-[#888]">
          <span>Need help with delivery? Call 01700000000</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1A1A1A] text-white font-semibold rounded-lg hover:bg-[#C5A059] transition-colors cursor-pointer"
          >
            Close (বন্ধ করুন)
          </button>
        </div>

      </div>
    </div>
  );
};
