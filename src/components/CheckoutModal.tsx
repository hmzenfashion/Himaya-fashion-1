import React, { useState, useEffect } from 'react';
import { CartItem, Order, StoreSettings } from '../types';
import {
  X,
  CheckCircle,
  ShieldCheck,
  Lock,
  CreditCard,
  Truck,
  Copy,
  Check,
  MapPin,
  Mail,
  Phone,
  User,
  AlertCircle,
  LogIn,
  ArrowRight,
  RefreshCw,
  Sparkles,
  MessageCircle,
  ExternalLink,
  Share2
} from 'lucide-react';
import {
  createOrderInFirestore,
  CustomerUser,
  loginCustomerWithEmail,
  registerCustomerWithEmail,
  signOutUser,
  clearStoredCustomer
} from '../firebase';
import {
  BANGLADESH_DIVISIONS,
  DISTRICTS_BY_DIVISION,
  THANAS_BY_DISTRICT,
  isDhakaMetro
} from '../data/bangladeshLocations';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderSuccess: (order: Order) => void;
  storeSettings?: StoreSettings;
  currentUser?: CustomerUser | null;
  onCustomerAuthSuccess?: (customer: CustomerUser) => void;
  onSignOutCustomer?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onOrderSuccess,
  storeSettings,
  currentUser,
  onCustomerAuthSuccess,
  onSignOutCustomer,
}) => {
  // REQUIREMENT: Form fields must start EMPTY for every new order
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    division: '',
    district: '',
    thana: '',
    address: '',
    paymentMethod: 'cod',
    senderPhone: '',
    trxId: ''
  });

  const [deliveryArea, setDeliveryArea] = useState<'Inside Dhaka' | 'Outside Dhaka'>('Inside Dhaka');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedType, setCopiedType] = useState<'bkash' | 'nagad' | 'whatsapp' | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Auth gate state when guest clicks "Confirm Order"
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authMethod, setAuthMethod] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Reset form to completely empty whenever the modal is opened for a new checkout
  useEffect(() => {
    if (isOpen) {
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        division: '',
        district: '',
        thana: '',
        address: '',
        paymentMethod: 'cod',
        senderPhone: '',
        trxId: ''
      });
      setCompletedOrder(null);
      setFormErrors({});
      setShowAuthGate(false);
      setAuthError('');
      setDeliveryArea('Inside Dhaka');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const insideRate = storeSettings?.deliveryChargeInsideDhaka ?? 80;
  const outsideRate = storeSettings?.deliveryChargeOutsideDhaka ?? 150;
  const deliveryCharge = deliveryArea === 'Inside Dhaka' ? insideRate : outsideRate;
  const subtotal = cartItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const total = subtotal + deliveryCharge;

  const bkashNum = storeSettings?.bkashNumber || '01712-345678';
  const bkashType = storeSettings?.bkashType || 'Personal';
  const nagadNum = storeSettings?.nagadNumber || '01912-345678';
  const nagadType = storeSettings?.nagadType || 'Personal';

  const handleCopy = (text: string, type: 'bkash' | 'nagad') => {
    navigator.clipboard?.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Division selection handler
  const handleDivisionChange = (div: string) => {
    setFormData(prev => ({
      ...prev,
      division: div,
      district: '',
      thana: ''
    }));

    if (div.toLowerCase().includes('dhaka')) {
      setDeliveryArea('Inside Dhaka');
    } else if (div) {
      setDeliveryArea('Outside Dhaka');
    }
  };

  // District selection handler
  const handleDistrictChange = (dist: string) => {
    setFormData(prev => ({
      ...prev,
      district: dist,
      thana: ''
    }));

    if (dist.toLowerCase().includes('dhaka')) {
      setDeliveryArea('Inside Dhaka');
    } else if (dist) {
      setDeliveryArea('Outside Dhaka');
    }
  };

  // Thana selection handler
  const handleThanaChange = (thn: string) => {
    setFormData(prev => ({
      ...prev,
      thana: thn
    }));

    const isMetro = isDhakaMetro(formData.division, formData.district, thn);
    if (isMetro) {
      setDeliveryArea('Inside Dhaka');
    } else if (thn) {
      setDeliveryArea('Outside Dhaka');
    }
  };

  // Validate Bangladesh Mobile Number format
  const isValidBdPhone = (p: string) => {
    const clean = p.replace(/[\s\-\+]/g, '');
    return /^01[3-9]\d{8}$/.test(clean) || /^8801[3-9]\d{8}$/.test(clean);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.customerName.trim()) {
      errors.customerName = 'Please enter your full name (আপনার পুরো নাম লিখুন)';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Mobile Phone Number is required (মোবাইল নম্বর দেওয়া বাধ্যতামূলক)';
    } else if (!isValidBdPhone(formData.phone)) {
      errors.phone = 'Please enter a valid 11-digit Bangladeshi number (e.g. 01712345678)';
    }

    if (!formData.division) {
      errors.division = 'Please select a Division (বিভাগ নির্বাচন করুন)';
    }

    if (!formData.district) {
      errors.district = 'Please select a District (জেলা নির্বাচন করুন)';
    }

    if (!formData.thana) {
      errors.thana = 'Please select a Thana / Upazila (থানা/উপজেলা নির্বাচন করুন)';
    }

    if (!formData.address.trim()) {
      errors.address = 'Please provide detailed delivery address (বিস্তারিত ঠিকানা লিখুন)';
    }

    if (formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') {
      if (!formData.senderPhone.trim()) {
        errors.senderPhone = 'Sender phone number is required';
      }
      if (!formData.trxId.trim()) {
        errors.trxId = 'Transaction ID (TrxID) is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Format rich WhatsApp message containing product pictures, sizes, quantities, prices, and customer details
  const generateWhatsAppMessage = (order: Order): string => {
    const itemsList = (order.items || []).map((item, idx) => {
      let text = `🔹 *${idx + 1}. ${item.title}*\n`;
      text += `   • সাইজ (Size): ${item.size || 'Free Size'}\n`;
      text += `   • কালার (Color): ${item.color || 'Default'}\n`;
      text += `   • পরিমাণ (Quantity): ${item.quantity} পিস\n`;
      text += `   • দাম (Price): ৳${item.price} x ${item.quantity} = ৳${(item.price * item.quantity).toFixed(2)}\n`;
      if (item.image) {
        text += `   • পণ্যের ছবি (Image Link): ${item.image}\n`;
      }
      return text;
    }).join('\n');

    const paymentText = order.paymentMethod === 'bkash'
      ? `বিকাশ (bKash) ${order.paymentTrxId ? `| TrxID: ${order.paymentTrxId} (নম্বর: ${order.paymentSenderPhone})` : ''}`
      : order.paymentMethod === 'nagad'
      ? `নগদ (Nagad) ${order.paymentTrxId ? `| TrxID: ${order.paymentTrxId} (নম্বর: ${order.paymentSenderPhone})` : ''}`
      : 'ক্যাশ অন ডেলিভারি (Cash on Delivery)';

    const orderTime = new Date(order.createdAt || Date.now()).toLocaleString('bn-BD', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    return `🛍️ *নতুন অর্ডার কনফার্মেশন — হিমায়া ফ্যাশন*
━━━━━━━━━━━━━━━━━━━━
📦 *অর্ডার আইডি:* #${order.id}
📅 *অর্ডারের সময়:* ${orderTime}

👤 *গ্রাহকের তথ্য:*
• নাম: ${order.customerName}
• ফোন নম্বর: ${order.phone}
${order.email ? `• ইমেইল: ${order.email}\n` : ''}📍 *ডেলিভারি ঠিকানা:*
• বিস্তারিত ঠিকানা: ${order.address}
• থানা/এলাকা: ${order.thana || order.city || 'N/A'}
• জেলা: ${order.district || 'N/A'}
• বিভাগ: ${order.division || 'N/A'}
• ডেলিভারি এরিয়া: ${order.deliveryArea || 'Inside Dhaka'} (চার্জ: ৳${order.deliveryCharge || 80})

👗 *অর্ডারকৃত পণ্যসমূহ (${order.items.length}টি):*
${itemsList}
━━━━━━━━━━━━━━━━━━━━
💳 *পেমেন্ট পদ্ধতি:* ${paymentText}
💰 *পণ্যের মোট মূল্য:* ৳${(order.totalAmount - (order.deliveryCharge || 0)).toFixed(2)}
🚚 *ডেলিভারি চার্জ:* ৳${(order.deliveryCharge || 0).toFixed(2)}
✨ *সর্বমোট প্রদেয় টাকা:* ৳${order.totalAmount.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━
*হিমায়া ফ্যাশন (Himaya Fashion)*`;
  };

  const getAdminWhatsAppLink = (order: Order): string => {
    const rawNumber = storeSettings?.whatsappNumber || storeSettings?.contactPhone || '8801712345678';
    let cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '88' + cleanNumber;
    } else if (!cleanNumber.startsWith('880') && cleanNumber.length === 10) {
      cleanNumber = '880' + cleanNumber;
    } else if (!cleanNumber) {
      cleanNumber = '8801712345678';
    }
    const msg = generateWhatsAppMessage(order);
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
  };

  // Final Order Submission logic
  const executeOrderSubmission = async (activeCustomer?: CustomerUser | null) => {
    setIsSubmitting(true);
    const userToRecord = activeCustomer || currentUser;

    const newOrderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const cleanCity = `${formData.thana}, ${formData.district}`.substring(0, 100);

    const orderData: Order = {
      id: newOrderId,
      customerName: formData.customerName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      division: formData.division,
      district: formData.district,
      thana: formData.thana,
      address: formData.address.trim(),
      city: cleanCity,
      deliveryArea: deliveryArea,
      deliveryCharge: deliveryCharge,
      items: cartItems.map(i => ({
        id: i.product.id,
        title: i.product.title,
        price: i.product.price,
        quantity: i.quantity,
        size: i.selectedSize,
        color: i.selectedColor,
        image: i.selectedImage || i.product.image
      })),
      totalAmount: total,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      paymentMethod: formData.paymentMethod,
      paymentSenderPhone: formData.senderPhone.trim(),
      paymentTrxId: formData.trxId.trim(),
      customerId: userToRecord?.id,
      customerAuthType: userToRecord?.authProvider
    };

    try {
      // 1. Save directly to Firebase Firestore
      await createOrderInFirestore(orderData).catch(err => {
        console.warn("Firestore order direct save warning:", err);
      });

      // 2. Also register in local server
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json().catch(() => ({ success: true, order: orderData }));

      const finalizedOrder = data.order || orderData;
      setCompletedOrder(finalizedOrder);
      onOrderSuccess(finalizedOrder);
      setShowAuthGate(false);

      // Automatically launch WhatsApp with full order details, product pictures, and prices
      try {
        const waLink = getAdminWhatsAppLink(finalizedOrder);
        window.open(waLink, '_blank');
      } catch (waErr) {
        console.warn("Could not automatically open WhatsApp window:", waErr);
      }
    } catch (err) {
      console.error("Order submission failed, using client order", err);
      setCompletedOrder(orderData);
      onOrderSuccess(orderData);
      setShowAuthGate(false);

      try {
        const waLink = getAdminWhatsAppLink(orderData);
        window.open(waLink, '_blank');
      } catch (waErr) {
        console.warn("Could not automatically open WhatsApp window:", waErr);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form submission handler: Triggers auth gate if user is guest!
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // REQUIREMENT: When a user clicks "Confirm Order," trigger login/sign-up step if not signed in!
    if (!currentUser) {
      setAuthError('');
      setShowAuthGate(true);
      return;
    }

    // Already signed in: proceed directly without showing sign-up prompt!
    await executeOrderSubmission(currentUser);
  };

  const handleCheckoutLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authEmail.trim() || !authEmail.includes('@')) {
      setAuthError('অনুগ্রহ করে সঠিক জিমেইল অ্যাড্রেস লিখুন');
      return;
    }
    if (!authPassword || authPassword.length < 4) {
      setAuthError('কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন');
      return;
    }

    setIsAuthLoading(true);
    try {
      const customer = await loginCustomerWithEmail(authEmail, authPassword);
      if (onCustomerAuthSuccess) {
        onCustomerAuthSuccess(customer);
      }
      await executeOrderSubmission(customer);
    } catch (err: any) {
      console.error("Login error at checkout:", err);
      setAuthError(err.message || 'লগইন ব্যর্থ হয়েছে।');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCheckoutRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authName.trim()) {
      setAuthError('আপনার নাম লিখুন');
      return;
    }
    if (!authEmail.trim() || !authEmail.includes('@')) {
      setAuthError('সঠিক জিমেইল অ্যাড্রেস লিখুন');
      return;
    }
    if (!authPassword || authPassword.length < 4) {
      setAuthError('কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন');
      return;
    }

    setIsAuthLoading(true);
    try {
      await registerCustomerWithEmail(authName, authEmail, authPassword);
      setAuthSuccess('রেজিস্ট্রেশন সফল হয়েছে! এখন লগইন ট্যাবে গিয়ে লগইন করুন।');
      setTimeout(() => {
        setAuthMethod('login');
        setAuthPassword('');
        setAuthSuccess('');
      }, 1500);
    } catch (err: any) {
      console.error("Register error at checkout:", err);
      setAuthError(err.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOutFromCheckout = async () => {
    try {
      await signOutUser();
      clearStoredCustomer();
      if (onSignOutCustomer) {
        onSignOutCustomer();
      }
    } catch (err) {
      console.warn("Sign out error:", err);
    }
  };

  // Available districts for chosen division
  const availableDistricts = formData.division ? (DISTRICTS_BY_DIVISION[formData.division] || []) : [];
  // Available thanas for chosen district
  const availableThanas = formData.district ? (THANAS_BY_DISTRICT[formData.district] || []) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1A1A1A] text-white">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#C5A059]" />
            <h3 className="font-serif text-lg font-bold">Secure Checkout</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Persistent Authentication Banner */}
        <div className="bg-[#FAF9F6] border-b border-[#E6E2DD] px-6 py-2.5 flex items-center justify-between text-xs">
          {currentUser ? (
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Signed in as:{' '}
                <strong className="text-[#1A1A1A]">
                  {currentUser.displayName || currentUser.email || currentUser.phoneNumber}
                </strong>{' '}
                ({currentUser.authProvider === 'google' ? 'Google Account' : 'Verified Mobile'})
              </span>
              <button
                type="button"
                onClick={handleSignOutFromCheckout}
                className="text-slate-400 hover:text-red-600 underline ml-2 cursor-pointer"
              >
                Switch
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Guest Checkout Active &middot; Sign-in prompt triggers on order confirmation</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAuthGate(true);
                }}
                className="text-xs font-bold text-[#C5A059] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign In Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {completedOrder ? (
            /* Order Success View */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1A1A1A]">Order Confirmed!</h3>
              <p className="text-xs text-[#666] max-w-md mx-auto">
                Thank you for your order, <span className="font-bold text-[#1A1A1A]">{completedOrder.customerName}</span>. Your bespoke garments are being prepared with meticulous attention to detail.
              </p>

              {/* WhatsApp Order Dispatch Card */}
              <div className="bg-emerald-50 border-2 border-emerald-500/30 rounded-2xl p-4 max-w-md mx-auto text-left space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950">অ্যাডমিন হোয়াটসঅ্যাপে তথ্য পাঠানো হয়েছে</div>
                      <div className="text-[11px] text-emerald-700">পণ্যের ছবি, সাইজ, কালার ও দাম সহ বিস্তারিত</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full text-[10px] font-extrabold uppercase">
                    Auto-Dispatched
                  </span>
                </div>

                <p className="text-[11px] text-emerald-800 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                  অর্ডারটি সাথে সাথে অ্যাডমিনের হোয়াটসঅ্যাপে <strong>({(storeSettings?.whatsappNumber || '01712-345678')})</strong> পাঠানো হয়েছে। নিচের বাটন চেপে আপনিও সরাসরি অ্যাডমিনের সাথে হোয়াটসঅ্যাপে চ্যাট বা অর্ডার কনফার্ম করতে পারেন।
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    href={getAdminWhatsAppLink(completedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>হোয়াটসঅ্যাপে মেসেজ পাঠান</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(generateWhatsAppMessage(completedOrder));
                        setCopiedType('whatsapp');
                        setTimeout(() => setCopiedType(null), 2500);
                      } catch (e) {
                        console.warn("Clipboard copy failed:", e);
                      }
                    }}
                    className="py-2.5 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedType === 'whatsapp' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-emerald-700">কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-600" />
                        <span>মেসেজ কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Ordered items */}
              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E6E2DD] max-w-md mx-auto text-left space-y-2.5">
                <div className="text-xs font-bold text-slate-800 border-b pb-2 flex justify-between">
                  <span>Ordered Items ({completedOrder.items?.length || 0})</span>
                  <span className="font-mono text-[11px] text-slate-500">#{completedOrder.id}</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {completedOrder.items?.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-12 h-14 object-cover rounded-md border border-slate-200" />
                      )}
                      <div className="flex-1 text-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">{item.title}</div>
                        <div className="text-[11px] text-slate-500 flex gap-2 mt-0.5">
                          <span>রং: <strong className="text-slate-800">{item.color}</strong></span>
                          <span>সাইজ: <strong className="text-slate-800">{item.size}</strong></span>
                          <span>পরিমাণ: <strong className="text-slate-800">{item.quantity}</strong></span>
                        </div>
                        <div className="text-[11px] font-bold text-[#C5A059] mt-0.5">
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Details Receipt */}
              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E6E2DD] max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#666]">Recipient:</span>
                  <span className="font-semibold text-[#1A1A1A]">{completedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Phone:</span>
                  <span className="font-semibold text-[#1A1A1A] font-mono">{completedOrder.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Shipping Location:</span>
                  <span className="font-semibold text-[#1A1A1A] text-right">
                    {completedOrder.thana || completedOrder.city}, {completedOrder.district || ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Street Address:</span>
                  <span className="font-semibold text-[#1A1A1A] text-right max-w-xs">{completedOrder.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Delivery Area:</span>
                  <span className="font-semibold text-emerald-700">
                    {completedOrder.deliveryArea || 'Inside Dhaka'} (৳{completedOrder.deliveryCharge || 80})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Payment Method:</span>
                  <span className="font-semibold text-[#1A1A1A] uppercase">
                    {completedOrder.paymentMethod || 'COD'}
                  </span>
                </div>
                {completedOrder.paymentTrxId && (
                  <div className="flex justify-between">
                    <span className="text-[#666]">TrxID:</span>
                    <span className="font-mono font-bold text-pink-600">{completedOrder.paymentTrxId}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[#E6E2DD]">
                  <span className="text-[#1A1A1A] font-bold">Total Amount Payable:</span>
                  <span className="font-bold text-sm text-[#C5A059]">৳{completedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-3 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-xs font-semibold tracking-wider uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            /* Checkout Form with Empty Start & Bangladesh Locations */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Order Summary Preview */}
              <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E6E2DD] space-y-3">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                  <span>Order Summary ({cartItems.length} items)</span>
                  <span className="text-base text-[#C5A059] font-extrabold">৳{total.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-[#E6E2DD] pb-3">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-[#E6E2DD]/70">
                      <img
                        src={item.selectedImage || item.product.image}
                        alt={item.product.title}
                        className="w-12 h-14 object-cover rounded-md bg-slate-50 border border-slate-100"
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="font-bold text-[#1A1A1A] truncate">{item.product.title}</div>
                        <div className="text-[11px] text-[#666] flex flex-wrap gap-x-2 mt-0.5">
                          <span>Color: <strong className="text-[#1A1A1A]">{item.selectedColor}</strong></span>
                          <span>Size: <strong className="text-[#1A1A1A]">{item.selectedSize}</strong></span>
                        </div>
                        <div className="text-[11px] font-bold text-[#C5A059] mt-0.5">
                          {item.quantity}x &middot; ৳{(item.product.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#666]">
                    <span>Products Subtotal</span>
                    <span className="font-semibold text-[#1A1A1A]">৳{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#666]">
                    <span>Delivery Charge ({deliveryArea})</span>
                    <span className="font-semibold text-emerald-700">+৳{deliveryCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#1A1A1A] pt-2 border-t border-[#E6E2DD]">
                    <span>Total Payable</span>
                    <span className="text-sm font-extrabold text-[#1A1A1A]">৳{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 1. Recipient Information (Name, Email, Mandatory Phone) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#C5A059]" />
                    <span>Customer Details (গ্রাহকের তথ্য)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Manual entry required for every purchase
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#444] mb-1">
                      Full Name (সম্পূর্ণ নাম) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Eleanor Vance"
                      value={formData.customerName}
                      onChange={e => {
                        setFormData({ ...formData, customerName: e.target.value });
                        if (formErrors.customerName) setFormErrors(prev => ({ ...prev, customerName: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 text-xs border rounded-xl focus:outline-none transition-all ${
                        formErrors.customerName
                          ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400'
                          : 'border-[#E6E2DD] bg-white focus:ring-1 focus:ring-[#C5A059]'
                      }`}
                    />
                    {formErrors.customerName && (
                      <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{formErrors.customerName}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#444] mb-1">
                      Email Address (ইমেইল - Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. customer@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-[#E6E2DD] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444] mb-1 flex items-center justify-between">
                    <span>
                      Mobile Phone Number (মোবাইল নম্বর) <span className="text-red-500 font-bold">* Mandatory</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Bangladesh 11 Digits</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-xs font-bold text-slate-500">+880</span>
                    </div>
                    <input
                      type="tel"
                      placeholder="1712345678"
                      value={formData.phone.replace(/^\+?880?/, '')}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, phone: '01' + raw.replace(/^01?/, '') });
                        if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      className={`w-full pl-14 pr-3.5 py-2.5 text-xs border rounded-xl focus:outline-none font-mono transition-all ${
                        formErrors.phone
                          ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400'
                          : 'border-[#E6E2DD] bg-white focus:ring-1 focus:ring-[#C5A059]'
                      }`}
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Bangladesh Location Selection: Division, District, Thana */}
              <div className="space-y-3 pt-2 border-t border-[#E6E2DD]">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#C5A059]" />
                    <span>Bangladesh Location (ডেলিভারি লোকেশন)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    All 64 Districts & Upazilas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Division Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-[#444] mb-1">
                      Division (বিভাগ) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.division}
                      onChange={e => {
                        handleDivisionChange(e.target.value);
                        if (formErrors.division) setFormErrors(prev => ({ ...prev, division: '' }));
                      }}
                      className={`w-full px-3 py-2.5 text-xs border rounded-xl bg-white focus:outline-none transition-all ${
                        formErrors.division
                          ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400'
                          : 'border-[#E6E2DD] focus:ring-1 focus:ring-[#C5A059]'
                      }`}
                    >
                      <option value="">-- বিভাগ নির্বাচন করুন --</option>
                      {BANGLADESH_DIVISIONS.map(div => (
                        <option key={div} value={div}>{div}</option>
                      ))}
                    </select>
                    {formErrors.division && (
                      <p className="text-[10px] text-red-600 mt-1">{formErrors.division}</p>
                    )}
                  </div>

                  {/* District Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-[#444] mb-1">
                      District (জেলা) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.district}
                      disabled={!formData.division}
                      onChange={e => {
                        handleDistrictChange(e.target.value);
                        if (formErrors.district) setFormErrors(prev => ({ ...prev, district: '' }));
                      }}
                      className={`w-full px-3 py-2.5 text-xs border rounded-xl bg-white focus:outline-none transition-all ${
                        !formData.division ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''
                      } ${
                        formErrors.district
                          ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400'
                          : 'border-[#E6E2DD] focus:ring-1 focus:ring-[#C5A059]'
                      }`}
                    >
                      <option value="">
                        {!formData.division ? 'আগে বিভাগ বেছে নিন' : '-- জেলা নির্বাচন করুন --'}
                      </option>
                      {availableDistricts.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                    {formErrors.district && (
                      <p className="text-[10px] text-red-600 mt-1">{formErrors.district}</p>
                    )}
                  </div>

                  {/* Thana / Upazila Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-[#444] mb-1">
                      Thana / Upazila (থানা/উপজেলা) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.thana}
                      disabled={!formData.district}
                      onChange={e => {
                        handleThanaChange(e.target.value);
                        if (formErrors.thana) setFormErrors(prev => ({ ...prev, thana: '' }));
                      }}
                      className={`w-full px-3 py-2.5 text-xs border rounded-xl bg-white focus:outline-none transition-all ${
                        !formData.district ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''
                      } ${
                        formErrors.thana
                          ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400'
                          : 'border-[#E6E2DD] focus:ring-1 focus:ring-[#C5A059]'
                      }`}
                    >
                      <option value="">
                        {!formData.district ? 'আগে জেলা বেছে নিন' : '-- থানা নির্বাচন করুন --'}
                      </option>
                      {availableThanas.map(thn => (
                        <option key={thn} value={thn}>{thn}</option>
                      ))}
                    </select>
                    {formErrors.thana && (
                      <p className="text-[10px] text-red-600 mt-1">{formErrors.thana}</p>
                    )}
                  </div>
                </div>

                {/* Delivery Area Indicator */}
                <div className="flex items-center justify-between p-3 bg-[#FAF9F6] border border-[#E6E2DD] rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#C5A059]" />
                    <span className="font-semibold text-slate-800">
                      Auto-detected Delivery Zone: <strong className="text-emerald-700 font-bold">{deliveryArea}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[11px]">Fee:</span>
                    <span className="font-extrabold px-2 py-0.5 bg-[#1A1A1A] text-white rounded-md text-xs">
                      ৳{deliveryCharge}
                    </span>
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label className="block text-xs font-semibold text-[#444] mb-1">
                    Detailed Address (বাড়ি নং, রোড নং, এলাকা) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. House #24, Road #4, Sector #11, Dhanmondi"
                    value={formData.address}
                    onChange={e => {
                      setFormData({ ...formData, address: e.target.value });
                      if (formErrors.address) setFormErrors(prev => ({ ...prev, address: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs border rounded-xl bg-white focus:outline-none transition-all ${
                      formErrors.address
                        ? 'border-red-500 bg-red-50/40 ring-1 ring-red-400'
                        : 'border-[#E6E2DD] focus:ring-1 focus:ring-[#C5A059]'
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.address}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Payment Method */}
              <div className="space-y-3 pt-2 border-t border-[#E6E2DD]">
                <h4 className="font-serif text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#C5A059]" />
                  <span>Payment Method (পেমেন্ট পদ্ধতি)</span>
                </h4>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                    className={`p-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                      formData.paymentMethod === 'cod'
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-sm'
                        : 'border-[#E6E2DD] bg-white text-[#1A1A1A] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    Cash on Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'bkash' })}
                    className={`p-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                      formData.paymentMethod === 'bkash'
                        ? 'border-pink-600 bg-pink-50 text-pink-700 font-bold shadow-sm ring-1 ring-pink-600'
                        : 'border-[#E6E2DD] bg-white text-[#1A1A1A] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    bKash (বিকাশ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'nagad' })}
                    className={`p-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                      formData.paymentMethod === 'nagad'
                        ? 'border-orange-600 bg-orange-50 text-orange-700 font-bold shadow-sm ring-1 ring-orange-600'
                        : 'border-[#E6E2DD] bg-white text-[#1A1A1A] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    Nagad (নগদ)
                  </button>
                </div>

                {/* bKash Payment Details */}
                {formData.paymentMethod === 'bkash' && (
                  <div className="p-4 bg-pink-50/70 border border-pink-200 rounded-xl space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-pink-600">bKash {bkashType} Number</span>
                        <div className="text-base font-mono font-bold text-slate-900">{bkashNum}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(bkashNum, 'bkash')}
                        className="px-3 py-1.5 bg-white border border-pink-300 hover:bg-pink-100 text-pink-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedType === 'bkash' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedType === 'bkash' ? 'Copied!' : 'Copy Number'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      {storeSettings?.paymentInstructions || "বিকাশ অ্যাপ থেকে 'Send Money' অথবা 'Payment' করে নিচের ঘরে আপনার বিকাশ নম্বর ও TrxID লিখুন।"}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Sender bKash No. <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 017XXXXXXXX"
                          value={formData.senderPhone}
                          onChange={e => setFormData({ ...formData, senderPhone: e.target.value })}
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none font-mono ${
                            formErrors.senderPhone ? 'border-red-500' : 'border-pink-200 focus:ring-1 focus:ring-pink-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          TrxID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. BKA7928491"
                          value={formData.trxId}
                          onChange={e => setFormData({ ...formData, trxId: e.target.value })}
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none font-mono uppercase ${
                            formErrors.trxId ? 'border-red-500' : 'border-pink-200 focus:ring-1 focus:ring-pink-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Nagad Payment Details */}
                {formData.paymentMethod === 'nagad' && (
                  <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-orange-600">Nagad {nagadType} Number</span>
                        <div className="text-base font-mono font-bold text-slate-900">{nagadNum}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(nagadNum, 'nagad')}
                        className="px-3 py-1.5 bg-white border border-orange-300 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedType === 'nagad' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedType === 'nagad' ? 'Copied!' : 'Copy Number'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      {storeSettings?.paymentInstructions || "নগদ অ্যাপ থেকে 'Send Money' অথবা 'Payment' করে নিচের ঘরে আপনার নগদ নম্বর ও TrxID লিখুন।"}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Sender Nagad No. <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 019XXXXXXXX"
                          value={formData.senderPhone}
                          onChange={e => setFormData({ ...formData, senderPhone: e.target.value })}
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none font-mono ${
                            formErrors.senderPhone ? 'border-red-500' : 'border-orange-200 focus:ring-1 focus:ring-orange-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          TrxID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. NGD894210"
                          value={formData.trxId}
                          onChange={e => setFormData({ ...formData, trxId: e.target.value })}
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none font-mono uppercase ${
                            formErrors.trxId ? 'border-red-500' : 'border-orange-200 focus:ring-1 focus:ring-orange-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                <span>
                  {isSubmitting 
                    ? 'Processing Order...' 
                    : currentUser 
                      ? `Confirm Order & Pay ৳${total.toFixed(2)}`
                      : `Confirm Order & Pay ৳${total.toFixed(2)} (Guest Step)`}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Guest Authentication Modal / Gate: Triggers when guest clicks Confirm Order */}
      {showAuthGate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div 
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#1A1A1A] text-white">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C5A059]" />
                <h3 className="font-serif text-base font-bold">Sign In to Confirm Order</h3>
              </div>
              <button 
                onClick={() => setShowAuthGate(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C5A059] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Order Almost Complete</span>
                </div>
                <h4 className="font-serif text-lg font-bold text-slate-900">
                  Please Sign In or Sign Up
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Your order for <strong className="text-slate-900">৳{total.toFixed(2)}</strong> is ready. Connect your account to track delivery and confirm this purchase.
                </p>
              </div>

              {/* Auth Method Switcher: Login vs Register */}
              <div className="grid grid-cols-2 p-1 bg-[#FAF9F6] border border-[#E6E2DD] rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setAuthMethod('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    authMethod === 'login'
                      ? 'bg-[#1A1A1A] text-white shadow-xs'
                      : 'text-[#666] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>লগইন (Sign In)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('register'); setAuthError(''); setAuthSuccess(''); }}
                  className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    authMethod === 'register'
                      ? 'bg-[#1A1A1A] text-white shadow-xs'
                      : 'text-[#666] hover:text-[#1A1A1A]'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>রেজিস্টার (Register)</span>
                </button>
              </div>

              {authError && (
                <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold">
                  {authSuccess}
                </div>
              )}

              {/* Login Tab */}
              {authMethod === 'login' && (
                <form onSubmit={handleCheckoutLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gmail Address (জিমেইল) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E6E2DD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password (পাসওয়ার্ড) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E6E2DD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      আপনার রেজিস্টার্ড জিমেইল ও পাসওয়ার্ড দিয়ে অর্ডার নিশ্চিত করুন।
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading || isSubmitting}
                    className="w-full py-3.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                    <span>{isAuthLoading ? 'লগইন হচ্ছে...' : 'লগইন করে অর্ডার কনফার্ম করুন'}</span>
                  </button>
                </form>
              )}

              {/* Register Tab */}
              {authMethod === 'register' && (
                <form onSubmit={handleCheckoutRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name (আপনার নাম) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir Ahmed"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E6E2DD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gmail Address (জিমেইল) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E6E2DD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password (পাসওয়ার্ড তৈরি করুন) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E6E2DD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading || isSubmitting}
                    className="w-full py-3.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <User className="w-4 h-4 text-[#C5A059]" />
                    <span>{isAuthLoading ? 'রেজিস্ট্রেশন হচ্ছে...' : 'রেজিস্ট্রেশন করে অ্যাকাউন্ট তৈরি করুন'}</span>
                  </button>
                </form>
              )}

              <div className="text-[11px] text-center text-slate-400 pt-1">
                You will remain signed in for all future orders on this device.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
