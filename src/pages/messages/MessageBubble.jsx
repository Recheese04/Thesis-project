import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, avatarColor, formatFullTime } from './messageHelpers';

// ─── Date separator ──────────────────────────────────────────────────────────
export function DateSep({ label }) {
  return (
    <div className="flex items-center gap-3 my-4 px-2">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] text-slate-400 font-medium">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

// ─── Image bubble ─────────────────────────────────────────────────────────────
function ImageMsg({ url, isMine }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img
        src={url}
        alt="Shared image"
        onClick={() => setOpen(true)}
        className={`
          max-w-[220px] max-h-[220px] object-cover cursor-pointer rounded-2xl
          ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}
          hover:opacity-90 transition-opacity shadow-sm
        `}
      />
      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <img src={url} alt="Full" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────
export default function MessageBubble({ msg, isMine, showAvatar, showName, isFirst, isLast, isGroup }) {
  const color = avatarColor(msg.sender_name);

  return (
    <div className={`flex items-end gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Avatar slot */}
      <div className="w-7 shrink-0 self-end mb-0.5">
        {!isMine && showAvatar && (
          <Avatar className="w-7 h-7">
            <AvatarFallback className={`bg-gradient-to-br ${color} text-white text-[10px] font-bold`}>
              {getInitials(msg.sender_name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Content column */}
      <div className={`flex flex-col max-w-[72%] sm:max-w-[60%] ${isMine ? 'items-end' : 'items-start'}`}>

        {/* Sender name (group only, first in run) */}
        {!isMine && showName && isGroup && (
          <span className="text-[11px] font-semibold text-slate-500 ml-1 mb-1">
            {msg.sender_name}
          </span>
        )}

        {/* Image */}
        {msg.image_url && (
          <div className="mb-1">
            <ImageMsg url={msg.image_url} isMine={isMine} />
          </div>
        )}

        {/* Text bubble — only render if there's text */}
        {msg.message && (
          <div className={`
            px-4 py-2 text-sm leading-relaxed break-words select-text
            ${isMine
              ? `bg-blue-500 text-white ${isLast ? 'rounded-[18px] rounded-br-[4px]' : 'rounded-[18px]'}`
              : `bg-slate-100 text-slate-900 ${isLast ? 'rounded-[18px] rounded-bl-[4px]' : 'rounded-[18px]'}`
            }
          `}>
            {msg.message}
          </div>
        )}

        {/* Timestamp on hover, last bubble of run only */}
        {isLast && (
          <span className="text-[10px] text-slate-400 mt-0.5 mx-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {formatFullTime(msg.created_at)}
          </span>
        )}
      </div>

      {/* Right spacer */}
      {isMine && <div className="w-1 shrink-0" />}
    </div>
  );
}