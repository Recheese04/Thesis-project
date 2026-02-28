import { useRef, useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Info, Send, Smile, ImagePlus,
  Users, RefreshCw, AlertCircle, X, Phone,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import MessageBubble, { DateSep } from './MessageBubble';
import { getInitials, avatarColor, groupByDate } from './messageHelpers';
import { getCurrentUser } from './useMessages';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="flex-1 min-h-0 overflow-hidden p-4 space-y-3 animate-pulse">
      {[56, 80, 48, 96, 64].map((w, i) => (
        <div key={i} className={`flex gap-2 items-end ${i%2?'flex-row-reverse':''}`}>
          {!(i%2) && <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0"/>}
          <div className="h-9 rounded-2xl bg-slate-200" style={{width:`${w*3}px`,maxWidth:'60%'}}/>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty({ name, isGroup }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-3xl">
        {isGroup ? '👥' : '👋'}
      </div>
      <div>
        <p className="font-bold text-slate-800">{name}</p>
        <p className="text-slate-400 text-sm mt-1">
          {isGroup ? 'Welcome to the group chat!' : `Start a private conversation with ${name}`}
        </p>
      </div>
    </div>
  );
}

// ─── No chat selected (desktop placeholder) ───────────────────────────────────
function NoChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
        <Users className="w-9 h-9 text-blue-300" />
      </div>
      <div className="text-center">
        <p className="font-bold text-slate-700">Select a conversation</p>
        <p className="text-slate-400 text-sm mt-1">Choose from your chats on the left</p>
      </div>
    </div>
  );
}

// ─── Image preview in input ───────────────────────────────────────────────────
function ImagePreview({ file, onRemove }) {
  const url = URL.createObjectURL(file);
  return (
    <div className="relative w-16 h-16 shrink-0">
      <img src={url} alt="preview" className="w-full h-full object-cover rounded-xl" />
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-700 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ChatArea({
  chat, messages, loading, sending, error,
  members, onSend, onRetry, onClearError, onBack,
}) {
  const [text, setText]         = useState('');
  const [image, setImage]       = useState(null);  // File | null
  const endRef                  = useRef(null);
  const textareaRef             = useRef(null);
  const fileInputRef            = useRef(null);
  const currentUser             = getCurrentUser();
  const currentUserId           = currentUser?.id ?? null;

  const isGroup  = !chat || chat.type !== 'pm';
  const title    = isGroup ? 'Group Chat'  : chat?.name ?? '';
  const subtitle = isGroup
    ? `${members.length} member${members.length !== 1?'s':''}`
    : (chat?.position || chat?.role || '');
  const bg       = isGroup ? 'from-blue-500 to-indigo-600' : avatarColor(chat?.name ?? '');
  const grouped  = groupByDate(messages);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chat]);

  // Reset input when switching chats
  useEffect(() => {
    setText('');
    setImage(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [chat]);

  const handleSend = useCallback(async () => {
    if ((!text.trim() && !image) || sending) return;
    const ok = await onSend(chat, text, image);
    if (ok) {
      setText('');
      setImage(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  }, [text, image, sending, onSend, chat]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
    e.target.value = '';
  };

  // Run grouping for consecutive-sender detection
  const runInfo = (items, i) => {
    const it = items[i];
    if (it.type !== 'msg') return { isFirst: true, isLast: true };
    const pm = items[i-1]?.type === 'msg' ? items[i-1].data : null;
    const nm = items[i+1]?.type === 'msg' ? items[i+1].data : null;
    return {
      isFirst: !pm || pm.sender_id !== it.data.sender_id,
      isLast:  !nm || nm.sender_id !== it.data.sender_id,
    };
  };

  // ── No chat selected on desktop
  if (!chat && typeof chat === 'undefined') return <NoChat />;

  return (
    /*
     * LAYOUT CONTRACT:
     *   - This component fills whatever height its parent gives (h-full)
     *   - overflow-hidden on this div prevents any leaking
     *   - Only the messages div (flex-1 min-h-0 overflow-y-auto) scrolls
     *   - Header and input are shrink-0, always visible
     */
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* ── HEADER ── shrink-0 ─────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
        {/* Back — mobile */}
        <button
          onClick={onBack}
          className="md:hidden -ml-1 p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Avatar className="w-10 h-10 shrink-0">
          <AvatarFallback className={`bg-gradient-to-br ${bg} text-white font-bold`}>
            {isGroup ? '👥' : getInitials(title)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm truncate">{title}</p>
          <p className="text-xs text-slate-400 truncate">{subtitle}</p>
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={onRetry} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="hidden sm:flex p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── ERROR ── shrink-0 ──────────────────────────────────────── */}
      {error && (
        <div className="shrink-0 flex items-center gap-2 mx-4 mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={onRetry} className="underline">Retry</button>
          <button onClick={onClearError}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── MESSAGES ── flex-1 min-h-0 → only scrollable area ───────── */}
      {loading ? <Skeleton /> : messages.length === 0 ? (
        <Empty name={title} isGroup={isGroup} />
      ) : (
        <div
          className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-0.5 bg-white"
          style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(0,0,0,0.07) transparent' }}
        >
          {grouped.map((item, i) => {
            if (item.type === 'sep') return <DateSep key={item.key} label={item.label} />;
            const msg    = item.data;
            const isMine = msg.sender_id === currentUserId;
            const { isFirst, isLast } = runInfo(grouped, i);
            return (
              <div key={item.key} className={isFirst ? 'mt-4' : 'mt-0.5'}
                   style={{animation:'pop .14s ease-out both'}}>
                <MessageBubble
                  msg={msg} isMine={isMine}
                  showAvatar={!isMine && isLast}
                  showName={!isMine && isFirst}
                  isFirst={isFirst} isLast={isLast}
                  isGroup={isGroup}
                />
              </div>
            );
          })}
          <div ref={endRef} className="h-1" />
        </div>
      )}

      {/* ── INPUT BAR ── shrink-0 ──────────────────────────────────── */}
      <div className="shrink-0 px-3 py-3 border-t border-slate-100 bg-white">

        {/* Image preview row */}
        {image && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <ImagePreview file={image} onRemove={() => setImage(null)} />
            <span className="text-xs text-slate-400 truncate">{image.name}</span>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Image picker */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 flex items-center justify-center transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpg,image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleImagePick}
          />

          {/* Text input pill */}
          <div className="flex-1 flex items-end gap-2 bg-slate-100 rounded-full px-4 py-2 min-h-[40px]">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKey}
              placeholder="Aa"
              rows={1}
              disabled={sending}
              className="
                flex-1 resize-none bg-transparent border-0 outline-none ring-0
                text-slate-800 placeholder:text-slate-400 text-sm leading-relaxed
                overflow-y-auto py-0.5
              "
              style={{ maxHeight:'120px', minHeight:'20px' }}
            />
            <button
              onClick={() => {}}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || (!text.trim() && !image)}
            className={`
              shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90
              ${(text.trim() || image) && !sending
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {sending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pop {
          from { opacity:0; transform:translateY(5px) scale(.98); }
          to   { opacity:1; transform:none; }
        }
      `}</style>
    </div>
  );
}