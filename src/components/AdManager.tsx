import React, { useEffect, useState, useRef } from 'react';
import { AdConfiguration, WebsiteAdItem } from '../types';
import { X, ExternalLink, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface AdManagerProps {
  config?: AdConfiguration;
  isAdminOpen?: boolean;
}

export const AdManager: React.FC<AdManagerProps> = ({ config, isAdminOpen = false }) => {
  const [isBannerMinimized, setIsBannerMinimized] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const hasTriggeredPopunder = useRef(false);

  // If ads are globally disabled or config is missing, return null
  if (!config || !config.globalAdsEnabled) {
    return null;
  }

  const activeAds = (config.ads || []).filter(ad => ad.enabled);
  if (activeAds.length === 0) {
    return null;
  }

  // 1. Popunder / Direct Link handler
  useEffect(() => {
    // If admin panel is open, do not trigger popunders
    if (isAdminOpen) return;

    const popunderAd = activeAds.find(ad => ad.type === 'popunder' && ad.linkUrl);
    if (!popunderAd || !popunderAd.linkUrl) return;

    const cooldownMinutes = config.popunderCooldownMinutes || 1;
    const cooldownMs = cooldownMinutes * 60 * 1000;

    const handleGlobalClick = (e: MouseEvent) => {
      // Don't trigger if clicked on admin or modal elements
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-no-popunder="true"]') || target?.closest('.admin-no-popunder')) {
        return;
      }

      const lastTriggered = localStorage.getItem('himaya_last_popunder_time');
      const now = Date.now();

      if (!lastTriggered || now - parseInt(lastTriggered, 10) > cooldownMs) {
        try {
          // Open popunder in new tab
          const newWindow = window.open(popunderAd.linkUrl, '_blank', 'noopener,noreferrer');
          if (newWindow) {
            localStorage.setItem('himaya_last_popunder_time', now.toString());
            hasTriggeredPopunder.current = true;
          }
        } catch (err) {
          console.warn('Popunder trigger note:', err);
        }
      }
    };

    window.addEventListener('click', handleGlobalClick, { passive: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [activeAds, config.popunderCooldownMinutes, isAdminOpen]);

  // 2. Banner ads (Floating Corner or Bottom Bar)
  const floatingScriptAd = activeAds.find(ad => 
    (ad.type === 'script_banner' || ad.type === 'custom_html') && 
    (ad.placement === 'floating_corner' || !ad.placement)
  );

  const directLinkAd = activeAds.find(ad => ad.type === 'direct_link' && ad.linkUrl);

  return (
    <>
      {/* Floating Corner Script / Iframe Banner (Adsterra 160x300 or custom) */}
      {floatingScriptAd && !isBannerDismissed && (
        <aside 
          aria-label="বিজ্ঞাপন"
          className="fixed bottom-20 right-3 z-40 transition-all duration-300 pointer-events-auto"
          data-no-popunder="true"
        >
          <div className="bg-[#111827]/95 backdrop-blur-md border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center p-1.5 transition-all w-[172px]">
            {/* Ad Header with Badge & Controls */}
            <div className="w-full flex items-center justify-between px-1 py-1 border-b border-slate-700/60 mb-1 text-[10px]">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="tracking-wide uppercase">বিজ্ঞাপন</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsBannerMinimized(!isBannerMinimized)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isBannerMinimized ? "ব্যানার বড় করুন" : "মিনিমাইজ করুন"}
                >
                  {isBannerMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsBannerDismissed(true)}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="বিজ্ঞাপন বন্ধ করুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Ad Content (Iframe isolation for scripts) */}
            {!isBannerMinimized && (
              <div className="w-[160px] h-[300px] bg-white rounded-lg overflow-hidden relative shadow-inner flex items-center justify-center">
                <iframe
                  title="Sponsored Content"
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
    ${floatingScriptAd.scriptCode || ''}
  </body>
</html>`}
                  className="w-[160px] h-[300px] border-0 select-none"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                  loading="lazy"
                />
              </div>
            )}

            {isBannerMinimized && (
              <button 
                onClick={() => setIsBannerMinimized(false)}
                className="py-1 text-[11px] text-amber-300 hover:text-white font-medium cursor-pointer"
              >
                বিজ্ঞাপন দেখুন ↗
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Floating Direct Link Button (if direct link ad configured) */}
      {directLinkAd && (
        <aside 
          aria-label="স্পন্সর লিংক"
          className="fixed bottom-4 left-4 z-40 hidden md:flex items-center pointer-events-auto"
          data-no-popunder="true"
        >
          <a
            href={directLinkAd.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold rounded-full shadow-lg border border-amber-400/40 transition-transform hover:scale-105"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{directLinkAd.name || 'Sponsored Offer'}</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </aside>
      )}
    </>
  );
};
