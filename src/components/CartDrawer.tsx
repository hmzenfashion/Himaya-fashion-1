import React, { useState } from 'react';
import { CartItem } from '../types';
import { CustomerUser } from '../firebase';
import { X, Trash2, ShoppingBag, ArrowRight, Lock, LogIn } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onProceedCheckout: () => void;
  currentUser?: CustomerUser | null;
  onOpenAuth?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
  currentUser,
  onOpenAuth,
}) => {
  const [deliveryArea, setDeliveryArea] = useState<'Inside Dhaka' | 'Outside Dhaka'>('Inside Dhaka');

  if (!isOpen) return null;

  const deliveryCharge = cartItems.length > 0 ? (deliveryArea === 'Inside Dhaka' ? 80 : 150) : 0;
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const total = subtotal + deliveryCharge;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#E6E2DD] bg-[#FAF9F6]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C5A059]" />
              <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">Your Shopping Bag</h2>
              <span className="text-xs bg-[#1A1A1A] text-white px-2 py-0.5 rounded-full font-semibold">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#1A1A1A] hover:text-[#C5A059] transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 bg-[#FAF9F6] rounded-full flex items-center justify-center mx-auto text-[#C5A059]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">Your bag is empty</h3>
                <p className="text-xs text-[#666] max-w-xs mx-auto">
                  Explore our luxury collections and add your favorite pieces to begin your order.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#1A1A1A] text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#C5A059] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-[#FAF9F6] rounded-xl border border-[#E6E2DD]">
                  <img
                    src={item.selectedImage || item.product.image}
                    alt={item.product.title}
                    className="w-20 h-24 object-cover rounded-lg bg-white"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#1A1A1A] line-clamp-1">
                        {item.product.title}
                      </h4>
                      <div className="text-[11px] text-[#666] mt-0.5">
                        Size: <span className="font-semibold text-[#1A1A1A]">{item.selectedSize}</span> &middot; 
                        Color: <span className="font-semibold text-[#1A1A1A]">{item.selectedColor}</span>
                      </div>
                      <div className="text-sm font-bold text-[#1A1A1A] mt-1">
                        ৳{(item.product.price * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-[#E6E2DD] rounded-md bg-white">
                        <button
                          onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 1))}
                          className="px-2.5 py-1 text-xs font-bold text-[#1A1A1A] hover:bg-[#FAF9F6]"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                          className="px-2.5 py-1 text-xs font-bold text-[#1A1A1A] hover:bg-[#FAF9F6]"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-[#E6E2DD] bg-[#FAF9F6] space-y-4">
              {/* Delivery Zone Selector in Cart */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-[#1A1A1A]">
                  <span>Delivery Zone</span>
                  <span className="text-slate-500 font-normal">Inside: ৳80 | Outside: ৳150</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryArea('Inside Dhaka')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                      deliveryArea === 'Inside Dhaka'
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs'
                        : 'border-[#E6E2DD] bg-white text-[#1A1A1A] hover:bg-slate-50'
                    }`}
                  >
                    Inside Dhaka (৳80)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryArea('Outside Dhaka')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                      deliveryArea === 'Outside Dhaka'
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs'
                        : 'border-[#E6E2DD] bg-white text-[#1A1A1A] hover:bg-slate-50'
                    }`}
                  >
                    Outside Dhaka (৳150)
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between text-[#666]">
                  <span>Products Subtotal</span>
                  <span className="font-semibold text-[#1A1A1A]">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#666]">
                  <span>Delivery Charge ({deliveryArea})</span>
                  <span className="font-semibold text-emerald-700">+৳{deliveryCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1A1A1A] pt-2 border-t border-[#E6E2DD]">
                  <span>Total Amount</span>
                  <span className="text-base text-[#C5A059]">৳{total.toFixed(2)}</span>
                </div>
              </div>

              {!currentUser ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold">অর্ডার করতে লগইন আবশ্যক</span>
                      <span className="text-[11px] text-amber-700 block">লগইন ছাড়া অর্ডার সম্পন্ন হবে না।</span>
                    </div>
                  </div>
                  {onOpenAuth && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#C5A059] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>লগইন</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate">লগইন রয়েছেন: <strong>{currentUser.displayName || currentUser.email || currentUser.phoneNumber}</strong></span>
                </div>
              )}

              <button
                onClick={() => {
                  onClose();
                  onProceedCheckout();
                }}
                className="w-full py-3.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{currentUser ? 'Proceed to Secure Checkout' : 'Proceed to Checkout (লগইন আবশ্যক)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[10px] text-center text-[#888]">
                Home Delivery across Bangladesh &middot; Cash on Delivery available
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
