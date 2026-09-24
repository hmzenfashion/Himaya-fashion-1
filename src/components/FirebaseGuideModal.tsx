import React from 'react';
import { X, Database, CheckCircle2, Cloud, ShieldCheck, Flame, Server } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseGuideModal: React.FC<FirebaseGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1A1A1A] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">Firebase Cloud Database Status</h2>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active &amp; Real-time Connected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 text-xs sm:text-sm text-[#333]">
          
          {/* Active Status Card */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>ওয়েবসাইটটি সফলভাবে Firebase এর সাথে যুক্ত করা হয়েছে!</span>
            </div>
            <p className="text-emerald-700 leading-relaxed text-xs">
              আপনার ওয়েবসাইটের সমস্ত প্রোডাক্ট, কাস্টমার অর্ডার, ব্যানার বিজ্ঞাপন এবং ইনভেন্টরি ডেটা এখন স্বয়ংক্রিয়ভাবে Google Cloud Firebase Firestore-এ রিয়েলটাইমে সেভ ও সিঙ্ক হচ্ছে।
            </p>
          </div>

          {/* Configuration details */}
          <div className="space-y-3 p-4 bg-[#FAF9F6] rounded-xl border border-[#E6E2DD]">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#C5A059]" />
              Firebase Database Configuration
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-lg border border-[#E6E2DD]">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Firebase Project ID</div>
                <div className="font-mono font-semibold text-[#1A1A1A] text-xs mt-0.5">{firebaseConfig.projectId}</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-[#E6E2DD]">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Firestore Database ID</div>
                <div className="font-mono font-semibold text-[#1A1A1A] text-xs mt-0.5 truncate">{firebaseConfig.firestoreDatabaseId}</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-[#E6E2DD]">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Auth Domain</div>
                <div className="font-mono font-semibold text-[#1A1A1A] text-xs mt-0.5">{firebaseConfig.authDomain}</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-[#E6E2DD]">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Storage Bucket</div>
                <div className="font-mono font-semibold text-[#1A1A1A] text-xs mt-0.5">{firebaseConfig.storageBucket}</div>
              </div>
            </div>
          </div>

          {/* Active Collections */}
          <div className="space-y-3 p-4 bg-[#FAF9F6] rounded-xl border border-[#E6E2DD]">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#C5A059]" />
              সক্রিয় ক্লাউড কালেকশনসমূহ (Collections)
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#E6E2DD]">
                <div>
                  <strong className="font-mono text-emerald-700">/products</strong>
                  <p className="text-[11px] text-slate-500">সমস্ত প্রোডাক্টের নাম, দাম, ছবি, স্টক, সাইজ ও কালার ডেটা</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">Real-time Sync</span>
              </li>
              <li className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#E6E2DD]">
                <div>
                  <strong className="font-mono text-emerald-700">/orders</strong>
                  <p className="text-[11px] text-slate-500">কাস্টমারদের প্লেস করা নতুন অর্ডার এবং স্ট্যাটাস ট্র্যাকিং</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">Live Orders</span>
              </li>
              <li className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#E6E2DD]">
                <div>
                  <strong className="font-mono text-emerald-700">/banners</strong>
                  <p className="text-[11px] text-slate-500">হোমপেজের হিরো ব্যানার এবং প্রোমোশনাল বিজ্ঞাপন</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">Active</span>
              </li>
            </ul>
          </div>

          {/* Security Rules */}
          <div className="space-y-2 p-4 bg-[#FAF9F6] rounded-xl border border-[#E6E2DD]">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Firestore Security Rules
            </h3>
            <p className="text-[#666] text-xs leading-relaxed">
              আপনার ডেটা সুরক্ষিত রাখতে <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E6E2DD]">firestore.rules</code> কঠোর স্কিমা ভ্যালিডেশনের সাথে ক্লাউডে ডেপ্লয় করা হয়েছে।
            </p>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-xs font-semibold tracking-wider uppercase rounded-xl transition-all shadow cursor-pointer"
            >
              বন্ধ করুন (Close)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
