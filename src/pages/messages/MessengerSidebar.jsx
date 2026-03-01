import { useState, useMemo } from 'react';
import { Search, SquarePen, Sun, Moon, Plus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, avatarColor, formatTime } from './messageHelpers';
import { useTheme } from './ThemeContext';

function Tab({ label, active, onClick, mobileLight }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
        active
          ? mobileLight ? 'bg-violet-500 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
          : mobileLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white/80',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function ConvoRow({ name, subtitle, time, unread, isOnline, isGroup, isSelected, onClick, mobileLight, avatarBg }) {
  const bg = avatarBg ?? (isGroup ? 'from-violet-500 to-indigo-600' : avatarColor(name));
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 text-left',
        isSelected
          ? mobileLight ? 'bg-violet-50' : 'bg-white/10'
          : mobileLight ? 'hover:bg-slate-50' : 'hover:bg-white/5',
      ].join(' ')}
    >
      <div className="relative shrink-0">
        <Avatar className={`w-12 h-12 ring-2 ${mobileLight ? 'ring-slate-100' : 'ring-white/10'}`}>
          <AvatarFallback className={`bg-gradient-to-br ${bg} text-white font-bold text-sm`}>
            {isGroup ? (name?.[0]?.toUpperCase() ?? '👥') : getInitials(name)}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className={`absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 shadow-lg shadow-emerald-400/30 ${mobileLight ? 'border-white' : 'border-[#1a1a2e]'}`} />
        )}
      </div>
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
          <span className={['text-[10px] shrink-0 tabular-nums',
            unread ? 'text-violet-500 font-semibold' : mobileLight ? 'text-slate-400' : 'text-white/25',
          ].join(' ')}>
            {time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className={['text-xs truncate',
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

export default function MessengerSidebar({
  members, groups, selectedChat,
  onSelectChat, onSelectGroup, onCreateGroup,
  getMessages, getGroupMessages,
}) {
  const [tab, setTab]    = useState('all');
  const [search, setSearch] = useState('');
  const { toggle, dark } = useTheme();
  const mobileLight = !dark;

  // Org-wide group chat last message
  const orgGroupMsgs  = getMessages(null);
  const lastOrgMsg    = orgGroupMsgs[orgGroupMsgs.length - 1];
  const orgPreview    = lastOrgMsg
    ? (lastOrgMsg.image_url ? '📷 Photo' : `${lastOrgMsg.sender_name}: ${lastOrgMsg.message}`)
    : 'Start the conversation…';

  const conversations = useMemo(() => {
    const q = search.toLowerCase();

    // ── Org-wide group chat ────────────────────────────────────────────────
    const orgChat = {
      key: 'org-group', type: 'org',
      name: 'Org Group Chat',
      subtitle: orgPreview,
      time: lastOrgMsg ? formatTime(lastOrgMsg.created_at) : '',
      unread: 0, isOnline: false, isGroup: true,
      avatarBg: 'from-slate-600 to-slate-800',
    };

    // ── Custom group chats ─────────────────────────────────────────────────
    const gcList = groups
      .filter(g => g.name.toLowerCase().includes(q))
      .map(g => {
        const msgs = getGroupMessages(g.id);
        const last = msgs[msgs.length - 1];
        return {
          key: `gc-${g.id}`, type: 'gc', groupId: g.id,
          name: g.name,
          subtitle: g.last_message ?? (last ? (last.image_url ? '📷 Photo' : last.message) : `${g.members_count} members`),
          time: g.last_time ? formatTime(g.last_time) : '',
          unread: 0, isOnline: false, isGroup: true,
          avatarBg: g.avatar_color,
        };
      });

    // ── DMs ────────────────────────────────────────────────────────────────
    const dmList = members
      .filter(m => m.name.toLowerCase().includes(q))
      .map(m => ({
        key: `pm-${m.id}`, type: 'pm', userId: m.id,
        name: m.name,
        subtitle: m.last_message ?? (m.position || m.role),
        time: m.last_time ? formatTime(m.last_time) : '',
        unread: m.unread ?? 0, isOnline: true, isGroup: false,
        position: m.position, role: m.role,
      }));

    if (tab === 'groups') return [orgChat, ...gcList];
    if (tab === 'dms')    return dmList;
    return [orgChat, ...gcList, ...dmList];
  }, [members, groups, tab, search, orgPreview, lastOrgMsg, getGroupMessages]);

  const isSelected = (conv) => {
    if (conv.type === 'org')  return !selectedChat;
    if (conv.type === 'gc')   return selectedChat?.type === 'gc' && selectedChat.groupId === conv.groupId;
    if (conv.type === 'pm')   return selectedChat?.type === 'pm' && selectedChat.userId === conv.userId;
    return false;
  };

  const handleClick = (conv) => {
    if (conv.type === 'org') { onSelectChat(null); return; }
    if (conv.type === 'gc')  { onSelectGroup({ id: conv.groupId, name: conv.name, avatar_color: conv.avatarBg }); return; }
    onSelectChat({ type: 'pm', userId: conv.userId, name: conv.name, role: conv.role, position: conv.position });
  };

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const sidebarBg  = 'linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)';
  const mobileBg   = dark ? '#13131f' : '#ffffff';
  const borderR    = dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0';
  const titleCol   = mobileLight ? 'text-slate-900' : 'text-white';
  const btnCls     = mobileLight
    ? 'bg-slate-100 hover:bg-slate-200 text-slate-500'
    : 'bg-white/10 hover:bg-white/20 text-slate-300';
  const searchCls  = mobileLight
    ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-violet-300'
    : 'bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:border-violet-400/60';
  const tabsWrap   = mobileLight ? 'bg-slate-100' : 'bg-white/5';
  const emptyCol   = mobileLight ? 'text-slate-400' : 'text-white/25';
  const fadeBg     = mobileLight
    ? 'linear-gradient(to top,#ffffff,transparent)'
    : 'linear-gradient(to top,#13131f,transparent)';

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Desktop background */}
      <div className="hidden md:block absolute inset-0 pointer-events-none" style={{ background: sidebarBg }} />
      {/* Mobile background */}
      <div className="md:hidden absolute inset-0 pointer-events-none" style={{ background: mobileBg, borderRight: borderR }} />

      <div className="relative flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-xl font-black tracking-tight md:text-white ${titleCol}`} style={{ letterSpacing: '-0.02em' }}>
              Messages
            </h1>
            <div className="flex items-center gap-1">
              {/* Create group */}
              <button
                onClick={onCreateGroup}
                title="New group chat"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors md:bg-white/10 md:hover:bg-white/20 md:text-slate-300 ${btnCls}`}
              >
                <Plus className="w-4 h-4" />
              </button>
              {/* Theme toggle */}
              <button
                onClick={toggle}
                title={dark ? 'Light mode' : 'Dark mode'}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors md:bg-white/10 md:hover:bg-white/20 ${btnCls}`}
              >
                {dark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors md:bg-white/10 md:hover:bg-white/20 md:text-slate-300 ${btnCls}`}>
                <SquarePen className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${mobileLight ? 'text-slate-400' : 'text-white/30'} md:text-slate-400`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className={`w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none transition-all duration-200 md:bg-white/10 md:border-white/10 md:text-white md:placeholder:text-slate-500 md:focus:border-violet-400/60 ${searchCls}`}
            />
          </div>

          {/* Tabs */}
          <div className={`flex items-center gap-1 rounded-full p-1 md:bg-white/5 ${tabsWrap}`}>
            {[['all','All'],['dms','DMs'],['groups','Groups']].map(([val, label]) => (
              <Tab key={val} label={label} active={tab === val} onClick={() => setTab(val)} mobileLight={mobileLight} />
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
          {conversations.length === 0 && (
            <p className={`text-center text-sm py-10 md:text-white/25 ${emptyCol}`}>No conversations found</p>
          )}

          {/* Section header for groups when on 'all' tab */}
          {tab === 'all' && groups.length > 0 && (
            <div className={`flex items-center justify-between px-3 pt-3 pb-1`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${mobileLight ? 'text-slate-400' : 'text-white/25'} md:text-white/25`}>
                Groups
              </span>
              <button
                onClick={onCreateGroup}
                className={`text-[10px] font-semibold text-violet-500 hover:text-violet-400 transition-colors`}
              >
                + New
              </button>
            </div>
          )}

          {conversations.map((conv, i) => {
            const { key, ...convProps } = conv;
            const prevType = conversations[i - 1]?.type;
            const showDmHeader = tab === 'all' && conv.type === 'pm' && prevType !== 'pm';
            return (
              <div key={key}>
                {showDmHeader && (
                  <div className="px-3 pt-3 pb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${mobileLight ? 'text-slate-400' : 'text-white/25'} md:text-white/25`}>
                      Direct Messages
                    </span>
                  </div>
                )}
                <ConvoRow
                  {...convProps}
                  mobileLight={mobileLight}
                  isSelected={isSelected(conv)}
                  onClick={() => handleClick(conv)}
                />
              </div>
            );
          })}

          {/* Empty state for groups tab with create CTA */}
          {tab === 'groups' && groups.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className={`text-sm mb-3 ${emptyCol}`}>No custom groups yet</p>
              <button
                onClick={onCreateGroup}
                className="px-4 py-2 rounded-xl bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600 transition-colors"
              >
                + Create a Group
              </button>
            </div>
          )}
        </div>

        {/* Bottom fade */}
        <div className="h-6 shrink-0 pointer-events-none" style={{ background: fadeBg }} />
      </div>
    </div>
  );
}