import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Cache clear error:', e);
    }
    window.location.href = window.location.origin + window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-md bg-white border border-[#E6E2DD] rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
                সাময়িক ত্রুটি হয়েছে
              </h2>
              <p className="text-xs sm:text-sm text-[#666] leading-relaxed">
                ব্রাউজারের ক্যাশ বা সংযোগের কারণে পেজটি লোড হতে সমস্যা হয়েছে। নিচের বাটনে চাপ দিয়ে ফ্রেশ রিলোড দিন।
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                পুনরায় চেষ্টা করুন (Reload)
              </button>

              <button
                onClick={this.handleHardReset}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                🔄 ক্যাশ ক্লিয়ার করে নতুন করে খুলুন
              </button>
            </div>

            <p className="text-[10px] text-slate-400">
              Himaya Fashion &middot; Luxury Couture Experience
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
