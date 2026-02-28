import { useState, useMemo } from 'react';
import { Search, Edit, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, avatarColor, formatTime } from './messageHelpers';
import { getCurrentUser } from './useMessages';

// ─── Tab pill ─────────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
        active
          ? 'bg-blue-100 text-blue-600'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Single conversation row ───────────────────────────────────────────────────
function ConvoRow({ name, subtitle, time, unread, isOnline, isGroup, isSelected, onClick }) {
  const bg = isGroup ? 'from-blue-500 to-indigo-600' : avatarColor(name);

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left
        ${isSelected ? 'bg-slate-100' : 'hover:bg-slate-50 active:bg-slate-100'}
      `}
    >
      {/* Avatar with online dot */}
      <div className="relative shrink-0">
        <Avatar className="w-[54px] h-[54px]">
          <AvatarFallback className={`bg-gradient-to-br ${bg} text-white font-bold text-base`}>
            {isGroup
              ? <span className="text-lg">👥</span>
              : getInitials(name)}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className={`text-sm truncate ${unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
            {name}
          </span>
          <span className={`text-[11px] shrink-0 ${unread ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
            {time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className={`text-xs truncate ${unread ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>
            {subtitle}
          </p>
          {unread > 0 && (
            <span className="shrink-0 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export default function MessengerSidebar({
  members, selectedChat, onSelectChat, getMessages,
}) {
  const [tab, setTab]       = useState('all');   // 'all' | 'dms' | 'groups'
  const [search, setSearch] = useState('');
  const currentUser         = getCurrentUser();

  // Group chat last message
  const groupMsgs   = getMessages(null);
  const lastGroup   = groupMsgs[groupMsgs.length - 1];
  const groupPreview = lastGroup
    ? (lastGroup.image_url ? '📷 Photo' : `${lastGroup.sender_name}: ${lastGroup.message}`)
    : 'No messages yet';

  const conversations = useMemo(() => {
    const filtered = members.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );

    const group = {
      type: 'group',
      id: 'group',
      name: 'Group Chat',
      subtitle: groupPreview,
      time: lastGroup ? formatTime(lastGroup.created_at) : '',
      unread: 0,
      isOnline: false,
      isGroup: true,
    };

    const dms = filtered.map(m => ({
      type: 'pm',
      id: `pm-${m.id}`,
      userId: m.id,
      name: m.name,
      subtitle: m.last_message ?? (m.position || m.role),
      time: m.last_time ? formatTime(m.last_time) : '',
      unread: m.unread ?? 0,
      isOnline: true,  // could be enhanced with presence
      isGroup: false,
      position: m.position,
      role: m.role,
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
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-5 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[22px] font-black text-slate-900">Chats</h1>
          <div className="flex items-center gap-1">
            <button className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <MoreHorizontal className="w-5 h-5 text-slate-600" />
            </button>
            <button className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <Edit className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Messenger"
            className="
              w-full pl-9 pr-4 py-2.5 rounded-full bg-slate-100
              text-slate-800 placeholder:text-slate-400 text-sm
              border-0 outline-none focus:ring-2 focus:ring-blue-200
              transition-all
            "
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1"
             style={{ scrollbarWidth: 'none' }}>
          <Tab label="All"    active={tab==='all'}    onClick={()=>setTab('all')} />
          <Tab label="DMs"    active={tab==='dms'}    onClick={()=>setTab('dms')} />
          <Tab label="Groups" active={tab==='groups'} onClick={()=>setTab('groups')} />
        </div>
      </div>

      {/* Conversation list — only this scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4"
           style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.06) transparent' }}>
        {conversations.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-10">No chats found</p>
        )}
        {conversations.map(conv => (
          <ConvoRow
            key={conv.id}
            {...conv}
            isSelected={isSelected(conv)}
            onClick={() => handleSelect(conv)}
          />
        ))}
      </div>
    </div>
  );
}