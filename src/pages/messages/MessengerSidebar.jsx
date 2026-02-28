import { useState, useMemo } from 'react';
import { Search, SquarePen, Sun, Moon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, avatarColor, formatTime } from './messageHelpers';
import { getCurrentUser } from './useMessages';
import { useTheme } from './ThemeContext';

/**
 * Sidebar theming rules:
 *
 * Desktop (md+):
 *   Light mode → navy gradient (always, as originally designed)
 *   Dark mode  → navy gradient (same, already dark)
 *
 * Mobile (<md):
 *   Light mode → white background, dark text
 *   Dark mode  → dark #13131f background, light text
 */

function Tab({ label, active, onClick, mobileLight }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200',
        active
          ? mobileLight
            ? 'bg-violet-500 text-white shadow-sm'          // mobile light active
            : 'bg-white text-slate-900 shadow-sm'           // desktop / dark active
          : mobileLight
            ? 'text-slate-400 hover:text-slate-700'         // mobile light inactive
            : 'text-white/40 hover:text-white/80',          // desktop / dark inactive
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function ConvoRow({ name, subtitle, time, unread, isOnline, isGroup, isSelected, onClick, mobileLight }) {
  const bg = isGroup ? 'from-violet-500 to-indigo-600' : avatarColor(name);

  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 text-left',
        isSelected
          ? mobileLight ? 'bg-violet-50'    : 'bg-white/10'
          : mobileLight ? 'hover:bg-slate-50' : 'hover:bg-white/5',
      ].join(' ')}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className={`w-12 h-12 ring-2 ${mobileLight ? 'ring-slate-100' : 'ring-white/10'}`}>
          <AvatarFallback className={`bg-gradient-to-br ${bg} text-white font-bold text-sm`}>
            {isGroup ? '👥' : getInitials(name)}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className={`absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 shadow-lg shadow-emerald-400/30 ${mobileLight ? 'border-white' : 'border-[#1a1a2e]'}`} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className={[
            'text-sm truncate',
            unread
              ? mobileLight ? 'font-bold text-slate-900' : 'font-bold text-white'
              : mobileLight ? 'font-medium text-slate-700' : 'font-medium text-white/70',
          ].join(' ')}>
            {name}
          </span>
          <span className={[
            'text-[10px] shrink-0 tabular-nums',
            unread ? 'text-violet-500 font-semibold' : mobileLight ? 'text-slate-400' : 'text-white/25',
          ].join(' ')}>
            {time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className={[
            'text-xs truncate',
            unread
              ? mobileLight ? 'text-slate-700 font-medium' : 'text-white/70 font-medium'
              : mobileLight ? 'text-slate-400' : 'text-white/30',
          ].join(' ')}>
            {subtitle}
          </p>
          {unread > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-violet-500/30">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function MessengerSidebar({ members, selectedChat, onSelectChat, getMessages }) {
  const [tab, setTab]    = useState('all');
  const [search, setSearch] = useState('');
  const { toggle, dark } = useTheme();

  const groupMsgs    = getMessages(null);
  const lastGroup    = groupMsgs[groupMsgs.length - 1];
  const groupPreview = lastGroup
    ? (lastGroup.image_url ? '📷 Photo' : `${lastGroup.sender_name}: ${lastGroup.message}`)
    : 'Start the conversation…';

  const conversations = useMemo(() => {
    const filtered = members.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );
    const group = {
      type: 'group', id: 'group', name: 'Group Chat',
      subtitle: groupPreview,
      time: lastGroup ? formatTime(lastGroup.created_at) : '',
      unread: 0, isOnline: false, isGroup: true,
    };
    const dms = filtered.map(m => ({
      type: 'pm', id: `pm-${m.id}`, userId: m.id,
      name: m.name,
      subtitle: m.last_message ?? (m.position || m.role),
      time: m.last_time ? formatTime(m.last_time) : '',
      unread: m.unread ?? 0, isOnline: true, isGroup: false,
      position: m.position, role: m.role,
    }));
    if (tab === 'groups') return [group];
    if (tab === 'dms')    return dms;
    return [group, ...dms];
  }, [members, tab, search, groupPreview, lastGroup]);

  const isSelected = (conv) => {
    if (!selectedChat && conv.type === 'group') return true;
    if (selectedChat?.type === 'pm' && conv.type === 'pm') return selectedChat.userId === conv.userId;
    return false;
  };

  const handleSelect = (conv) => {
    if (conv.type === 'group') onSelectChat(null);
    else onSelectChat({ type: 'pm', userId: conv.userId, name: conv.name, role: conv.role, position: conv.position });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">

      {/*
        ── DESKTOP LAYER (md+): always navy gradient ──────────────────────────
        Hidden on mobile, shown on desktop via absolute fill
      */}
      <div
        className="hidden md:block absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)' }}
      />

      {/*
        ── MOBILE LAYER (<md): white or dark based on theme ──────────────────
        Hidden on desktop
      */}
      <div
        className={`md:hidden absolute inset-0 pointer-events-none ${dark ? 'bg-[#13131f]' : 'bg-white'}`}
      />

      {/* ── CONTENT (sits above both bg layers) ──────────────────────────── */}
      <div className="relative flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="px-4 pt-5 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1
              className="text-xl font-black tracking-tight md:text-white"
              style={{ letterSpacing: '-0.02em' }}
            >
              {/* Mobile: dark text in light, white in dark. Desktop: always white */}
              <span className={`md:hidden ${dark ? 'text-white' : 'text-slate-900'}`}>Messages</span>
              <span className="hidden md:inline text-white">Messages</span>
            </h1>

            <div className="flex items-center gap-1">
              {/* Toggle button */}
              <button
                onClick={toggle}
                title={dark ? 'Light mode' : 'Dark mode'}
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                  // mobile: slate bg in light, white/10 in dark. desktop: always white/10
                  'md:bg-white/10 md:hover:bg-white/20',
                  dark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200',
                ].join(' ')}
              >
                {dark
                  ? <Sun className="w-4 h-4 text-yellow-400" />
                  : <Moon className={`w-4 h-4 md:text-slate-300 ${dark ? 'text-slate-300' : 'text-slate-500'}`} />
                }
              </button>
              <button
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                  'md:bg-white/10 md:hover:bg-white/20',
                  dark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200',
                ].join(' ')}
              >
                <SquarePen className={`w-4 h-4 md:text-slate-300 ${dark ? 'text-slate-300' : 'text-slate-500'}`} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none md:text-slate-400 ${dark ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className={[
                'w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none transition-all duration-200',
                // desktop always dark style
                'md:bg-white/10 md:border-white/10 md:text-white md:placeholder:text-slate-500 md:focus:border-violet-400/60 md:focus:bg-white/15',
                // mobile: light or dark
                dark
                  ? 'bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:border-violet-400/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-violet-300',
              ].join(' ')}
            />
          </div>

          {/* Tabs */}
          <div className={[
            'flex items-center gap-1 rounded-full p-1',
            'md:bg-white/5',
            dark ? 'bg-white/5' : 'bg-slate-100',
          ].join(' ')}>
            {['all', 'dms', 'groups'].map(t => (
              <Tab
                key={t}
                label={t.charAt(0).toUpperCase() + t.slice(1)}
                active={tab === t}
                onClick={() => setTab(t)}
                // mobileLight = on mobile AND light mode
                mobileLight={!dark}
              />
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
          {conversations.length === 0 && (
            <p className={`text-center text-sm py-10 md:text-white/25 ${dark ? 'text-white/25' : 'text-slate-400'}`}>
              No conversations found
            </p>
          )}
          {conversations.map(conv => (
            <ConvoRow
              key={conv.id}
              {...conv}
              mobileLight={!dark}
              isSelected={isSelected(conv)}
              onClick={() => handleSelect(conv)}
            />
          ))}
        </div>

        {/* Bottom fade */}
        <div
          className="h-6 shrink-0 pointer-events-none md:block"
          style={{
            background: dark
              ? 'linear-gradient(to top,#13131f,transparent)'
              : 'linear-gradient(to top,#ffffff,transparent)',
          }}
        />
      </div>
    </div>
  );
}