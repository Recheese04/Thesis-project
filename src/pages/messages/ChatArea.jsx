import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Info, Send, Smile, ImagePlus, Users, RefreshCw, AlertCircle, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import MessageBubble, { DateSep } from './MessageBubble';
import { getInitials, avatarColor, groupByDate } from './messageHelpers';
import { getCurrentUser } from './useMessages';
import { useTheme } from './ThemeContext';

function Skeleton({ dark }) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden px-4 py-6 space-y-4 animate-pulse">
      {[{ w: 160, mine: false }, { w: 220, mine: true }, { w: 130, mine: false }, { w: 260, mine: true }, { w: 180, mine: false }].map((s, i) => (
        <div key={i} className={`flex gap-2 items-end ${s.mine ? 'flex-row-reverse' : ''}`}>
          {!s.mine && <div className={`w-7 h-7 rounded-full shrink-0 ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />}
          <div className={`h-10 rounded-2xl ${dark ? 'bg-white/10' : 'bg-slate-200'}`} style={{ width: s.w, maxWidth: '70%' }} />
        </div>
      ))}
    </div>
  );
}

function Empty({ name, isGroup, dark }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: dark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)' }}>
        {isGroup ? '👥' : '👋'}
      </div>
      <div>
        <p className={`font-bold text-base ${dark ? 'text-white' : 'text-slate-800'}`}>{name}</p>
        <p className={`text-sm mt-1.5 max-w-xs ${dark ? 'text-white/40' : 'text-slate-400'}`}>
          {isGroup ? 'Welcome to the group chat!' : `Start a private conversation with ${name}.`}
        </p>
      </div>
    </div>
  );
}

function NoChat({ dark }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: dark ? '#0f0f1a' : 'linear-gradient(135deg,#fafafa,#f0f4ff)' }}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${dark ? 'bg-white/5' : 'bg-violet-50'}`}>
        <Users className={`w-9 h-9 ${dark ? 'text-white/20' : 'text-violet-300'}`} />
      </div>
      <div className="text-center">
        <p className={`font-bold text-base ${dark ? 'text-white/50' : 'text-slate-600'}`}>Select a conversation</p>
        <p className={`text-sm mt-1 ${dark ? 'text-white/25' : 'text-slate-400'}`}>Choose from your chats on the left</p>
      </div>
    </div>
  );
}

function ImagePreview({ file, onRemove, dark }) {
  const url = URL.createObjectURL(file);
  return (
    <div className="relative w-16 h-16 shrink-0">
      <img src={url} alt="preview" className="w-full h-full object-cover rounded-xl ring-2 ring-violet-400/40" />
      <button onClick={onRemove} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-md">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function ChatArea({ chat, messages, loading, sending, error, members, onSend, onRetry, onClearError, onBack }) {
  const [text, setText]   = useState('');
  const [image, setImage] = useState(null);
  const endRef            = useRef(null);
  const textareaRef       = useRef(null);
  const fileInputRef      = useRef(null);
  const currentUser       = getCurrentUser();
  const currentUserId     = currentUser?.id ?? null;
  const { dark }          = useTheme();

  const isGroup  = !chat || chat.type !== 'pm';
  const title    = isGroup ? 'Group Chat' : chat?.name ?? '';
  const subtitle = isGroup ? `${members.length} member${members.length !== 1 ? 's' : ''}` : (chat?.position || chat?.role || '');
  const bg       = isGroup ? 'from-violet-500 to-indigo-600' : avatarColor(chat?.name ?? '');
  const grouped  = groupByDate(messages);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, chat]);
  useEffect(() => {
    setText(''); setImage(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [chat]);

  const handleSend = useCallback(async () => {
    if ((!text.trim() && !image) || sending) return;
    const ok = await onSend(chat, text, image);
    if (ok) {
      setText(''); setImage(null);
      if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.focus(); }
    }
  }, [text, image, sending, onSend, chat]);

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleTextChange = (e) => {
    setText(e.target.value);
    const el = e.target; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };
  const handleImagePick = (e) => { const f = e.target.files?.[0]; if (f) setImage(f); e.target.value = ''; };

  const runInfo = (items, i) => {
    const it = items[i];
    if (it.type !== 'msg') return { isFirst: true, isLast: true };
    const pm = items[i - 1]?.type === 'msg' ? items[i - 1].data : null;
    const nm = items[i + 1]?.type === 'msg' ? items[i + 1].data : null;
    return { isFirst: !pm || pm.sender_id !== it.data.sender_id, isLast: !nm || nm.sender_id !== it.data.sender_id };
  };

  if (chat === undefined) return <NoChat dark={dark} />;
  const canSend = (text.trim() || image) && !sending;

  // Theme tokens
  const bg_main     = dark ? '#0f0f1a' : 'linear-gradient(180deg,#f8f9ff,#ffffff)';
  const border_col  = dark ? 'border-white/8'  : 'border-slate-100';
  const header_bg   = dark ? 'bg-[#13131f]/90' : 'bg-white/80';
  const title_col   = dark ? 'text-white'       : 'text-slate-900';
  const sub_col     = dark ? 'text-white/35'    : 'text-slate-400';
  const icon_col    = dark ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600';
  const input_bg    = dark ? 'bg-white/6 border-white/10 focus-within:border-violet-500/50 focus-within:bg-white/10' : 'bg-slate-50 border-slate-200 focus-within:border-violet-300 focus-within:bg-white';
  const text_col    = dark ? 'text-white'       : 'text-slate-800';
  const placeholder = dark ? 'placeholder:text-white/20' : 'placeholder:text-slate-400';

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: bg_main }}>

      {/* HEADER */}
      <div className={`shrink-0 flex items-center gap-3 px-4 py-3 border-b ${border_col} ${header_bg} backdrop-blur-sm`}>
        <button onClick={onBack} className={`md:hidden -ml-1 p-2 rounded-full hover:bg-white/10 transition-colors ${icon_col}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar className="w-10 h-10 shrink-0 shadow-sm">
          <AvatarFallback className={`bg-gradient-to-br ${bg} text-white font-bold text-sm`}>
            {isGroup ? '👥' : getInitials(title)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm truncate leading-tight ${title_col}`}>{title}</p>
          <p className={`text-xs truncate mt-0.5 ${sub_col}`}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={onRetry} className={`p-2 rounded-full hover:bg-white/10 transition-colors ${icon_col}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className={`hidden sm:flex p-2 rounded-full hover:bg-white/10 transition-colors ${icon_col}`}>
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="shrink-0 flex items-center gap-2 mx-4 mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={onRetry} className="underline font-medium">Retry</button>
          <button onClick={onClearError} className="ml-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* MESSAGES */}
      {loading
        ? <Skeleton dark={dark} />
        : messages.length === 0
          ? <Empty name={title} isGroup={isGroup} dark={dark} />
          : (
            <div
              className="flex-1 min-h-0 overflow-y-auto px-4 py-4"
              style={{ scrollbarWidth: 'thin', scrollbarColor: dark ? 'rgba(255,255,255,0.06) transparent' : 'rgba(0,0,0,0.08) transparent' }}
            >
              <div className="flex flex-col gap-0.5">
                {grouped.map((item, i) => {
                  if (item.type === 'sep') return <DateSep key={item.key} label={item.label} />;
                  const msg    = item.data;
                  const isMine = msg.sender_id === currentUserId;
                  const { isFirst, isLast } = runInfo(grouped, i);
                  return (
                    <div key={item.key} className={isFirst ? 'mt-3' : 'mt-0.5'}>
                      <MessageBubble msg={msg} isMine={isMine} showAvatar={!isMine && isLast} showName={!isMine && isFirst} isFirst={isFirst} isLast={isLast} isGroup={isGroup} />
                    </div>
                  );
                })}
              </div>
              <div ref={endRef} className="h-2" />
            </div>
          )
      }

      {/* INPUT */}
      <div className={`shrink-0 px-3 pb-3 pt-2 border-t ${border_col} ${dark ? 'bg-[#13131f]' : 'bg-white'}`}>
        {image && (
          <div className="flex items-center gap-3 mb-2.5 px-1">
            <ImagePreview file={image} onRemove={() => setImage(null)} dark={dark} />
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate ${dark ? 'text-white/60' : 'text-slate-600'}`}>{image.name}</p>
              <p className={`text-[10px] mt-0.5 ${dark ? 'text-white/30' : 'text-slate-400'}`}>{(image.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${dark ? 'bg-white/8 hover:bg-violet-500/20 text-white/40 hover:text-violet-400' : 'bg-slate-100 hover:bg-violet-50 text-slate-400 hover:text-violet-500'}`}
          >
            <ImagePlus style={{ width: 18, height: 18 }} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpg,image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleImagePick} />

          <div className={`flex-1 flex items-end gap-2 border rounded-2xl px-4 py-2.5 min-h-[44px] transition-all duration-200 ${input_bg}`}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKey}
              placeholder="Type a message…"
              rows={1}
              disabled={sending}
              className={`flex-1 resize-none bg-transparent border-0 outline-none ring-0 text-sm leading-relaxed overflow-y-auto py-0 ${text_col} ${placeholder}`}
              style={{ maxHeight: 120, minHeight: 20 }}
            />
            <button className={`shrink-0 transition-colors ${dark ? 'text-white/20 hover:text-white/50' : 'text-slate-300 hover:text-slate-500'}`}>
              <Smile style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
              canSend
                ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:scale-105'
                : dark ? 'bg-white/6 text-white/20 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            {sending
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send style={{ width: 16, height: 16, marginLeft: 1 }} />
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes msgPop  { from { opacity:0; transform:translateY(8px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  );
}