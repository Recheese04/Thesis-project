import { useState, useMemo } from 'react';
import { X, Search, UserPlus, Trash2, Crown, LogOut, Pencil, Check } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, avatarColor } from '../messages/messageHelpers';
import { useTheme } from '../messages/ThemeContext';

const COLORS = [
  'from-violet-500 to-indigo-600',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-500',
  'from-blue-500 to-cyan-500',
  'from-red-500 to-pink-600',
  'from-yellow-400 to-orange-500',
];

export default function GroupSettingsModal({
  group,          // { id, name, avatar_color, created_by, members: [{id, name, role}] }
  allMembers,     // all org members (for invite)
  currentUserId,
  onClose,
  onUpdate,       // (groupId, { name, avatar_color }) => Promise
  onAddMembers,   // (groupId, userIds) => Promise
  onRemoveMember, // (groupId, userId) => Promise
}) {
  const { dark } = useTheme();
  const [tab, setTab]         = useState('members'); // members | invite
  const [editingName, setEditingName] = useState(false);
  const [name, setName]       = useState(group.name);
  const [color, setColor]     = useState(group.avatar_color);
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving]   = useState(false);
  const [removing, setRemoving] = useState(null); // userId being removed

  const isAdmin = group.members.some(m => m.id === currentUserId && m.role === 'admin');
  const memberIds = new Set(group.members.map(m => m.id));

  const inviteable = useMemo(() =>
    allMembers.filter(m =>
      !memberIds.has(m.id) &&
      m.name.toLowerCase().includes(search.toLowerCase())
    ),
    [allMembers, memberIds, search]
  );

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSaveName = async () => {
    if (!name.trim() || (name === group.name && color === group.avatar_color)) {
      setEditingName(false); return;
    }
    setSaving(true);
    await onUpdate(group.id, { name: name.trim(), avatar_color: color });
    setSaving(false);
    setEditingName(false);
  };

  const handleAddMembers = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    await onAddMembers(group.id, [...selected]);
    setSaving(false);
    setSelected(new Set());
    setTab('members');
  };

  const handleRemove = async (userId) => {
    setRemoving(userId);
    await onRemoveMember(group.id, userId);
    setRemoving(null);
    if (userId === currentUserId) onClose(); // left the group
  };

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const card     = dark ? 'bg-[#1a1a2e] border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900';
  const divider  = dark ? 'border-white/8' : 'border-slate-100';
  const subText  = dark ? 'text-white/40' : 'text-slate-400';
  const inputCls = dark
    ? 'bg-white/8 border border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/60'
    : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-violet-400';
  const rowHover = dark ? 'hover:bg-white/5' : 'hover:bg-slate-50';
  const tabActive   = dark ? 'bg-white/10 text-white' : 'bg-violet-50 text-violet-600';
  const tabInactive = dark ? 'text-white/40 hover:text-white/70' : 'text-slate-400 hover:text-slate-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${card}`}
        style={{ animation: 'scaleIn .18s ease', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <div className={`shrink-0 px-5 py-4 border-b ${divider}`}>
          {/* Group avatar + name */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md shrink-0`}>
              <span className="text-white text-2xl font-bold">{group.name[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-sm outline-none transition-all ${inputCls}`}
                    autoFocus
                    maxLength={100}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="w-7 h-7 rounded-lg bg-violet-500 text-white flex items-center justify-center hover:bg-violet-600 transition-colors"
                  >
                    {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => { setEditingName(false); setName(group.name); }} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${dark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base truncate">{group.name}</p>
                  {isAdmin && (
                    <button
                      onClick={() => setEditingName(true)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 ${dark ? 'hover:bg-white/10 text-white/30' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              <p className={`text-xs mt-0.5 ${subText}`}>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${dark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Color picker (admin only) */}
          {isAdmin && (
            <div className="mb-3">
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${subText}`}>Group Color</p>
              <div className="flex items-center gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={async () => {
                      setColor(c);
                      await onUpdate(group.id, { name: group.name, avatar_color: c });
                    }}
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${c} transition-all ${
                      color === c ? `ring-2 ring-offset-1 ring-violet-500 scale-110 ${dark ? 'ring-offset-[#1a1a2e]' : 'ring-offset-white'}` : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className={`flex gap-1 rounded-xl p-1 ${dark ? 'bg-white/5' : 'bg-slate-100'}`}>
            {[['members', 'Members'], ['invite', 'Invite']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => { setTab(val); setSearch(''); setSelected(new Set()); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === val ? tabActive : tabInactive}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── MEMBERS TAB ──────────────────────────────────────────────────── */}
        {tab === 'members' && (
          <div className="flex-1 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: 'thin' }}>
            {group.members.map(m => {
              const isMe = m.id === currentUserId;
              const bg   = avatarColor(m.name);
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${rowHover} transition-all`}
                >
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className={`bg-gradient-to-br ${bg} text-white font-bold text-sm`}>
                      {getInitials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-slate-800'}`}>
                        {m.name}{isMe ? ' (you)' : ''}
                      </p>
                      {m.role === 'admin' && (
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className={`text-xs ${subText}`}>{m.role === 'admin' ? 'Admin' : 'Member'}</p>
                  </div>

                  {/* Remove / Leave button */}
                  {(isAdmin && !isMe) || isMe ? (
                    <button
                      onClick={() => handleRemove(m.id)}
                      disabled={removing === m.id}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        isMe
                          ? 'text-red-400 hover:bg-red-400/10'
                          : dark ? 'text-white/25 hover:text-red-400 hover:bg-red-400/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title={isMe ? 'Leave group' : 'Remove member'}
                    >
                      {removing === m.id
                        ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : isMe ? <LogOut className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* ── INVITE TAB ───────────────────────────────────────────────────── */}
        {tab === 'invite' && (
          <>
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${subText}`} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search members to invite…"
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all ${inputCls}`}
                />
              </div>
              {selected.size > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[...selected].map(id => {
                    const m = allMembers.find(m => m.id === id);
                    if (!m) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => toggleSelect(id)}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-500 text-xs font-medium hover:bg-violet-500/25"
                      >
                        {m.name.split(' ')[0]} <X className="w-3 h-3" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-1" style={{ scrollbarWidth: 'thin' }}>
              {inviteable.length === 0 && (
                <p className={`text-center text-sm py-8 ${subText}`}>
                  {allMembers.length === memberIds.size ? 'All members are already in this group' : 'No members found'}
                </p>
              )}
              {inviteable.map(m => {
                const isChecked = selected.has(m.id);
                const bg = avatarColor(m.name);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleSelect(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${rowHover}`}
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className={`bg-gradient-to-br ${bg} text-white font-bold text-sm`}>
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-slate-800'}`}>{m.name}</p>
                      <p className={`text-xs ${subText}`}>{m.position || m.role}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isChecked ? 'bg-violet-500 border-violet-500' : dark ? 'border-white/20' : 'border-slate-300'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {selected.size > 0 && (
              <div className={`px-4 py-3 border-t shrink-0 ${divider}`}>
                <button
                  onClick={handleAddMembers}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md shadow-violet-500/20 disabled:opacity-50"
                >
                  {saving
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><UserPlus className="w-4 h-4" /> Add {selected.size} member{selected.size !== 1 ? 's' : ''}</>
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes scaleIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  );
}