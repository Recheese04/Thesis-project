import React from 'react';

export default function PageLoader({ text = "Loading...", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="relative w-16 h-16 flex items-center justify-center mb-6">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full animate-pulse" />

        {/* Outer scaling ping */}
        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />

        {/* Static background track */}
        <div className="absolute inset-0 border-4 border-slate-100 rounded-full shadow-inner" />

        {/* Spinning gradient ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-[#0f2d5e] border-r-[#1e4db7] rounded-full animate-spin shadow-md" style={{ animationDuration: '1s' }} />

        {/* Center Logo */}
        <img
          src="/bisu-logo.png"
          alt="BISU"
          className="w-9 h-9 object-cover rounded-full shadow-sm"
        />
      </div>

      {/* Loading Text */}
      <p className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase animate-pulse">
        {text}
      </p>
    </div>
  );
}
