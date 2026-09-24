import React from 'react';
import { Smartphone, Download, CheckCircle2, ShieldCheck, X, Sparkles, ExternalLink, ArrowDownToLine, Info } from 'lucide-react';
import { StoreSettings } from '../types';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: StoreSettings;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  settings
}) => {
  if (!isOpen) return null;

  const apkUrl = settings?.appApkUrl || '/uploads/himaya-fashion.apk';
  const apkVersion = settings?.appApkVersion || 'v1.2.0';
  const apkSize = settings?.appApkSize || '16.8 MB';
  const downloadNotes = settings?.appDownloadNotes || 'Official Himaya Fashion Android App. Instant shopping, push order updates & exclusive member offers.';
  const buttonLabel = settings?.appButtonText || 'Download apps';

  const rawFilename = apkUrl.split('/').pop() || 'HimayaFashion.apk';

  const handleTriggerDownload = () => {
    // Specifically trigger direct file download without invoking Web App (PWA) prompt
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = apkUrl;
    // Set explicit filename for download attribute
    downloadAnchor.setAttribute('download', rawFilename);
    downloadAnchor.setAttribute('target', '_blank');
    downloadAnchor.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    setTimeout(() => {
      document.body.removeChild(downloadAnchor);
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E6E2DD] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luxury Header Banner */}
        <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#2A241E] to-[#1A1A1A] p-6 text-white overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-[#C5A059]/20 blur-2xl pointer-events-none" />
          
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#C5A059] to-[#E5C98B] p-0.5 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src="/icons/logo.png" 
                alt="Himaya Fashion App Icon" 
                className="w-full h-full rounded-[14px] object-cover shadow-inner"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#E5C98B] text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>Official Android App</span>
              </div>
              <h3 className="font-serif text-2xl font-bold tracking-tight text-white">
                Himaya Fashion
              </h3>
              <p className="text-xs text-white/70">
                Direct APK Installation for Android Smartphones
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Version Specs Pill Row */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DD] text-center">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Version</div>
              <div className="text-xs font-black text-slate-900 mt-0.5 font-mono">{apkVersion}</div>
            </div>
            <div className="border-x border-slate-200">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">File Size</div>
              <div className="text-xs font-black text-slate-900 mt-0.5 font-mono">{apkSize}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Platform</div>
              <div className="text-xs font-black text-emerald-700 mt-0.5 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Android</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 leading-relaxed">
            {downloadNotes}
          </p>

          {/* Main Direct Download Action Button */}
          <button
            type="button"
            onClick={handleTriggerDownload}
            className="w-full py-4 px-6 bg-[#C5A059] hover:bg-[#B08D44] active:scale-[0.99] text-white font-bold text-sm tracking-wide rounded-2xl shadow-lg shadow-[#C5A059]/30 transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            <ArrowDownToLine className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            <div className="text-left">
              <div className="leading-tight font-extrabold">{buttonLabel} ({apkSize})</div>
              <div className="text-[10px] text-white/90 font-normal">সরাসরি অ্যাপ ফাইল ({rawFilename}) ডাউনলোড করুন</div>
            </div>
          </button>

          {/* Quick 3-Step Install Guide */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>ইন্সটল করার সহজ নিয়ম (3 Easy Steps):</span>
            </div>
            <ol className="text-[11px] text-amber-950/80 space-y-1.5 list-decimal pl-4 leading-normal">
              <li>
                <strong>ডাউনলোড করুন:</strong> উপরের বাটনে ক্লিক করে <code>{apkUrl.split('/').pop() || 'HimayaFashion.apk'}</code> ফাইলটি ডাউনলোড করুন।
              </li>
              <li>
                <strong>ফাইল ওপেন করুন:</strong> নোটিফিকেশন বার অথবা ফোনের <em>Downloads</em> ফোল্ডার থেকে ফাইলটিতে ট্যাপ করুন।
              </li>
              <li>
                <strong>ইন্সটল সম্পন্ন করুন:</strong> <em>"Install"</em> বাটনে চাপ দিন (যদি ফোনের সেটিংসে <em>"Install from Unknown Sources"</em> চায়, তবে অনুমতি দিন)।
              </li>
            </ol>
          </div>

          {/* Verified Guarantee Badge */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Virus & Malware Free &middot; Verified APK</span>
            </div>
            <a 
              href={apkUrl} 
              download 
              className="text-[#C5A059] hover:underline font-semibold flex items-center gap-1"
            >
              Direct Link <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
