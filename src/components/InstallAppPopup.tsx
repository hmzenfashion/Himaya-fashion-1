import React, { useState, useEffect } from 'react';
import { Smartphone, Sparkles, X, CheckCircle2, ShieldCheck, Download, Share2, PlusSquare } from 'lucide-react';
import { StoreSettings } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallAppPopupProps {
  settings?: StoreSettings;
  forceOpen?: boolean;
  onClose?: () => void;
}

export const InstallAppPopup: React.FC<InstallAppPopupProps> = ({
  settings,
  forceOpen = false,
  onClose
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed' | 'ios_guide'>('idle');

  useEffect(() => {
    // 1. Detect if app is already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // 3. Listen for native browser PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // If user hasn't dismissed today or forced, show popup
      const dismissedTime = localStorage.getItem('himaya_pwa_prompt_dismissed');
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (!dismissedTime || now - Number(dismissedTime) > oneDay) {
        setTimeout(() => {
          setIsVisible(true);
        }, 1500);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem('himaya_pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if new customer should see prompt (even on iOS or before prompt fires)
    const hasSeenInstalled = localStorage.getItem('himaya_pwa_installed');
    const dismissedTime = localStorage.getItem('himaya_pwa_prompt_dismissed');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!isStandalone && !hasSeenInstalled && (!dismissedTime || now - Number(dismissedTime) > oneDay)) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Sync external forceOpen
  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true);
    }
  }, [forceOpen]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('himaya_pwa_prompt_dismissed', String(Date.now()));
    if (onClose) onClose();
  };

  const handleInstallClick = async () => {
    // 1. If deferred prompt is captured (Android Chrome, Edge, etc.)
    if (deferredPrompt) {
      setInstallStatus('installing');
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallStatus('installed');
          setIsInstalled(true);
          localStorage.setItem('himaya_pwa_installed', 'true');
          setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
          }, 1800);
        } else {
          setInstallStatus('idle');
        }
      } catch (err) {
        console.warn('Install error:', err);
        setInstallStatus('idle');
      }
      return;
    }

    // 2. If iOS Safari
    if (isIOS) {
      setInstallStatus('ios_guide');
      return;
    }

    // 3. Fallback: if browser doesn't support beforeinstallprompt yet, check if APK is available or inform customer
    if (settings?.appApkUrl) {
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = settings.appApkUrl;
      downloadAnchor.setAttribute('download', 'HimayaFashion.apk');
      downloadAnchor.setAttribute('target', '_blank');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      setTimeout(() => {
        document.body.removeChild(downloadAnchor);
        setInstallStatus('installed');
        setTimeout(() => setIsVisible(false), 2000);
      }, 500);
    } else {
      setInstallStatus('installed');
      setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 2000);
    }
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleDismiss}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E6E2DD] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luxury Gold/Dark Top Accent Banner */}
        <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#2A241E] to-[#1A1A1A] p-5 text-white overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 rounded-full bg-[#C5A059]/25 blur-xl pointer-events-none" />
          
          <button 
            type="button"
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 p-1.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            {/* App Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C5A059] to-[#E5C98B] p-0.5 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src="/icons/logo.png" 
                alt="Himaya Fashion App Icon" 
                className="w-full h-full rounded-[14px] object-cover"
              />
            </div>

            <div className="min-w-0 pr-6">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#E5C98B] text-[9px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>অফিশিয়াল মোবাইল অ্যাপ</span>
              </div>
              <h3 className="font-serif text-xl font-bold tracking-tight text-white leading-tight truncate">
                Himaya Fashion App
              </h3>
              <p className="text-[11px] text-white/80 mt-0.5">
                অফিসিয়াল অ্যাপ ইন্সটল করুন আপনার ফোনে
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {installStatus === 'ios_guide' ? (
            /* iOS Safari Instructions */
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Smartphone className="w-4 h-4 text-amber-700" />
                <span>iPhone / iPad এ যেভাবে ইন্সটল করবেন:</span>
              </div>
              <ol className="text-xs text-amber-950 space-y-2 list-decimal pl-4 leading-normal">
                <li className="flex items-start gap-1.5">
                  <span>1. সাফারির নিচে <strong>Share বাটন</strong> <Share2 className="w-3.5 h-3.5 inline text-[#C5A059]" /> এ ট্যাপ করুন।</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span>2. নিচে স্ক্রোল করে <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-[#C5A059]" /> সিলেক্ট করুন।</span>
                </li>
                <li>
                  <span>3. উপরের ডানপাশে <strong>"Add"</strong> বাটনে চাপলেই হোমস্ক্রিনে অ্যাপ যুক্ত হয়ে যাবে!</span>
                </li>
              </ol>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                ঠিক আছে, বুঝেছি
              </button>
            </div>
          ) : installStatus === 'installed' ? (
            /* Installed Celebration */
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">অ্যাপ সফলভাবে ইন্সটল হয়েছে!</h4>
              <p className="text-xs text-slate-500">আপনার ফোনের হোমস্ক্রিন থেকে এখন সহজেই শপিং করতে পারবেন।</p>
            </div>
          ) : (
            /* Main Install Body */
            <>
              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-800">সুপার ফাস্ট লোডিং</div>
                    <div className="text-[9px] text-slate-500">ডাটা খরচ বাঁচাবে</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-800">১-ক্লিক অর্ডার</div>
                    <div className="text-[9px] text-slate-500">হোয়াটসঅ্যাপ নোটিফিকেশন</div>
                  </div>
                </div>
              </div>

              {/* Primary Install App Button with High Visibility */}
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installStatus === 'installing'}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#B08D44] hover:to-[#C5A059] active:scale-[0.98] text-white font-extrabold text-sm tracking-wide rounded-2xl shadow-lg shadow-[#C5A059]/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer group disabled:opacity-50"
              >
                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>
                  {installStatus === 'installing' ? 'ইন্সটল হচ্ছে...' : 'Install App (অ্যাপ ইন্সটল করুন)'}
                </span>
              </button>

              {/* Dismiss / Secondary Action */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
                >
                  এখন নয় (Not Now)
                </button>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>100% সুরক্ষিত ও ফ্রি</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
