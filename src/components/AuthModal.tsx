import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import { CustomerUser, registerCustomerWithEmail, loginCustomerWithEmail } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: CustomerUser) => void;
  title?: string;
  subtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Customer Portal",
  subtitle = "Himaya Fashion - Register or Log in to manage your orders & delivery tracking.",
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('অনুগ্রহ করে সঠিক জিমেইল অ্যাড্রেস লিখুন');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন');
      return;
    }

    setIsLoading(true);
    try {
      const customer = await loginCustomerWithEmail(email, password);
      onSuccess(customer);
      onClose();
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMessage(err.message || 'লগইন ব্যর্থ হয়েছে। পাসওয়ার্ড বা জিমেইল চেক করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার নাম লিখুন');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('অনুগ্রহ করে সঠিক জিমেইল অ্যাড্রেস লিখুন');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন');
      return;
    }

    setIsLoading(true);
    try {
      const customer = await registerCustomerWithEmail(name, email, password);
      setSuccessMessage('সফলভাবে রেজিস্টার সম্পন্ন হয়েছে! এখন লগইন ট্যাবে গিয়ে লগইন করুন।');
      setTimeout(() => {
        setActiveTab('login');
        setPassword('');
        setSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      console.error("Registration failed:", err);
      setErrorMessage(err.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1A1A1A] text-white">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#C5A059]" />
            <h3 className="font-serif text-base font-bold">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-1">
            <div className="font-serif text-xl font-bold text-[#1A1A1A]">HIMAYA FASHION</div>
            <p className="text-xs text-[#666] leading-relaxed max-w-sm mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Auth Tabs: Login vs Register */}
          <div className="grid grid-cols-2 p-1 bg-[#FAF9F6] border border-[#E6E2DD] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#666] hover:text-[#1A1A1A]'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>লগইন (Sign In)</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#666] hover:text-[#1A1A1A]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>রেজিস্টার (Register)</span>
            </button>
          </div>

          {/* Error Message banner */}
          {errorMessage && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Success Message banner */}
          {successMessage && (
            <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold">
              {successMessage}
            </div>
          )}

          {/* Login Tab */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gmail Address (আপনার জিমেইল) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E6E2DD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  আপনার রেজিস্টার্ড জিমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন। (Admin: mhemal136@gmail.com)
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{isLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন (Login)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Register Tab */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (আপনার নাম) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E6E2DD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gmail Address (আপনার জিমেইল) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E6E2DD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Create Password (পাসওয়ার্ড তৈরি করুন) <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E6E2DD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  রেজিস্ট্রেশন করলে আপনার তথ্য ফায়ারবেসে নিরাপদে সংরক্ষিত হবে।
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{isLoading ? 'রেজিস্ট্রেশন হচ্ছে...' : 'রেজিস্ট্রেশন সম্পন্ন করুন (Register)'}</span>
                <UserPlus className="w-3.5 h-3.5 text-[#C5A059]" />
              </button>
            </form>
          )}

          {/* Security footnote */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted & Secured in Firebase Database</span>
          </div>
        </div>
      </div>
    </div>
  );
};
