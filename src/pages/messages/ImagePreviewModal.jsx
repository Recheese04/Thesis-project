import React, { useState, useEffect } from 'react';

export default function ImagePreviewModal({ url, isMine, onClose, onRemoveImage }) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm"
      style={{ animation: 'fadeIn .2s ease-out' }}
      onClick={onClose}
    >
      {/* Top Navigation Bar: Gradient for visibility over light images */}
      <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        {/* Top Left: Close */}
        <button
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
          onClick={onClose}
          title="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={url}
            download="image.jpg"
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            title="Download"
            onClick={e => e.stopPropagation()}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>

          {isMine && onRemoveImage && (
            <button
              className="w-10 h-10 rounded-full hover:bg-red-500/80 flex items-center justify-center text-white transition-colors"
              title="Remove Image"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage();
                onClose();
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Image Container */}
      <div className="relative w-full h-full flex items-center justify-center z-10 pt-[72px]">
        <img
          src={url}
          alt="Full size"
          className="max-w-[100vw] max-h-[100vh] md:max-w-[95vw] md:max-h-[85vh] object-contain drop-shadow-2xl"
          style={{ animation: 'scaleIn .25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          onClick={e => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
