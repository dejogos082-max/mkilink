import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function SecurityBadges() {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-gray-400 opacity-60 hover:opacity-100 transition-opacity duration-300">
      {/* Cloudflare Badge */}
      <div className="flex items-center gap-1.5 text-xs font-medium grayscale hover:grayscale-0 transition-all">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#F38020]">
          <path d="M16.94 9.14c-.33-2.61-2.54-4.64-5.24-4.64-2.13 0-3.96 1.25-4.8 3.06-1.92.2-3.4 1.83-3.4 3.82 0 2.12 1.72 3.84 3.84 3.84h9.6c1.86 0 3.36-1.5 3.36-3.36 0-1.74-1.32-3.18-3.02-3.34z"/>
        </svg>
        <span>Cloudflare</span>
      </div>

      {/* hCaptcha Badge */}
      <div className="flex items-center gap-1.5 text-xs font-medium grayscale hover:grayscale-0 transition-all">
        <div className="w-4 h-4 rounded bg-[#8544A5] flex items-center justify-center text-white font-bold text-[10px] leading-none pb-[1px]">
          h
        </div>
        <span>hCaptcha</span>
      </div>

      {/* MKI Secure Badge */}
      <div className="flex items-center gap-1.5 text-xs font-medium grayscale hover:grayscale-0 transition-all">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>MKI Secure</span>
      </div>
    </div>
  );
}
