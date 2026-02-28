import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, avatarColor, formatFullTime } from './messageHelpers';
import { useTheme } from './ThemeContext';

// ─── Date separator ───────────────────────────────────────────────────────────
export function DateSep({ label }) {
  const { dark } = useTheme();
  return (
    <div className="flex items-center gap-3 my-5 px-2">
      <div className={`flex-1 h-px ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
      <span className={`text-[10px] font-semibold uppercase tracking-widest px-1 ${dark ? 'text-white/30' : 'text-slate-400'}`}>
        {label}
      </span>
      <div className={`flex-1 h-px ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
    </div>
  );
}

// ─── Image bubble ─────────────────────────────────────────────────────────────
function ImageMsg({ url, isMine, isFirst, isLast, hasText }) {
  const [open, setOpen]       = useState(false);
  const [loaded, setLoaded]   = useState(false);
  const [errored, setErrored] = useState(false);
  const { dark } = useTheme();

  const radius = isMine
    ? `rounded-2xl ${isFirst ? 'rounded-tr-md' : ''} ${isLast && !hasText ? 'rounded-br-md' : ''}`
    : `rounded-2xl ${isFirst ? 'rounded-tl-md' : ''} ${isLast && !hasText ? 'rounded-bl-md' : ''}`;

  if (errored) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 text-xs ${radius} ${dark ? 'bg-white/10 text-white/40' : 'bg-slate-100 text-slate-400'}`}>
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Image unavailable
      </div>
    );
  }

  return (
    <>
      <div
        className={`relative overflow-hidden cursor-zoom-in group/img shadow-md ${radius}`}
        style={{ maxWidth: 260 }}
        onClick={() => loaded && setOpen(true)}
      >
        {!loaded && (
          <div className={`w-[220px] h-[165px] animate-pulse ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
        )}
        <img
          src={url}
          alt="Shared image"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`block w-auto h-auto max-w-[260px] max-h-[260px] object-cover transition-opacity duration-300 group-hover/img:brightness-90 ${loaded ? 'opacity-100' : 'opacity-0 w-0 h-0'}`}
        />
        {loaded && (
          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover/img:opacity-100 transition-opacity w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
          style={{ background: 'rgba(0,0,0,0.92)', animation: 'fadeIn .15s ease' }}
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={url}
            alt="Full size"
            className="rounded-2xl shadow-2xl object-contain"
            style={{ animation: 'scaleIn .18s ease', maxHeight: '90vh', maxWidth: '90vw' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────
export default function MessageBubble({
  msg, isMine, showAvatar, showName, isFirst, isLast, isGroup,
}) {
  const { dark } = useTheme();
  const color   = avatarColor(msg.sender_name);
  const hasText = !!msg.message;
  const hasImg  = !!msg.image_url;

  // iMessage-style run radius
  const myRadius = [
    'rounded-[20px]',
    isFirst && !isLast  ? 'rounded-tr-[6px]' : '',
    !isFirst && !isLast ? 'rounded-r-[6px]'  : '',
    !isFirst && isLast  ? 'rounded-br-[6px]' : '',
  ].filter(Boolean).join(' ');

  const theirRadius = [
    'rounded-[20px]',
    isFirst && !isLast  ? 'rounded-tl-[6px]' : '',
    !isFirst && !isLast ? 'rounded-l-[6px]'  : '',
    !isFirst && isLast  ? 'rounded-bl-[6px]' : '',
  ].filter(Boolean).join(' ');

  // ── MY bubble: always blue ──────────────────────────────────────────────────
  const myBubble = 'bg-blue-500 text-white shadow-md shadow-blue-500/20';

  // ── THEIR bubble: white (light) / dark card (dark) ─────────────────────────
  const theirBubble = dark
    ? 'bg-[#2a2a3d] text-white border border-white/8 shadow-sm'
    : 'bg-white text-slate-800 border border-slate-200 shadow-sm';

  return (
    <div
      className={`flex items-end gap-2 group/bubble ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ animation: 'msgPop .16s cubic-bezier(.34,1.4,.64,1) both' }}
    >
      {/* Avatar slot */}
      <div className="w-7 shrink-0 self-end mb-0.5">
        {!isMine && showAvatar && (
          <Avatar className="w-7 h-7 shadow-sm">
            <AvatarFallback className={`bg-gradient-to-br ${color} text-white text-[10px] font-bold`}>
              {getInitials(msg.sender_name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1 max-w-[72%] sm:max-w-[58%] ${isMine ? 'items-end' : 'items-start'}`}>

        {!isMine && showName && isGroup && (
          <span className={`text-[11px] font-semibold ml-1 ${dark ? 'text-white/40' : 'text-slate-400'}`}>
            {msg.sender_name}
          </span>
        )}

        {hasImg && (
          <ImageMsg
            url={msg.image_url}
            isMine={isMine}
            isFirst={isFirst}
            isLast={isLast && !hasText}
            hasText={hasText}
          />
        )}

        {hasText && (
          <div className={`
            px-4 py-2.5 text-sm leading-relaxed break-words select-text
            ${isMine
              ? `${myBubble} ${hasImg ? 'rounded-[20px] rounded-tr-[6px]' : myRadius}`
              : `${theirBubble} ${hasImg ? 'rounded-[20px] rounded-tl-[6px]' : theirRadius}`
            }
          `}>
            {msg.message}
          </div>
        )}

        {isLast && (
          <span className={`text-[10px] mx-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200 ${dark ? 'text-white/25' : 'text-slate-400'}`}>
            {formatFullTime(msg.created_at)}
          </span>
        )}
      </div>

      {isMine && <div className="w-1 shrink-0" />}
    </div>
  );
}