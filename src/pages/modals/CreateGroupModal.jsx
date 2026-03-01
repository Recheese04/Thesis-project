import { useState, useMemo } from 'react';
import { X, Users, Check, Pencil, Search, ChevronRight, ArrowLeft } from 'lucide-react';
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

export default function CreateGroupModal({ members, onClose, onCreate }) {
  const { dark } = useTheme();
  const [step, setStep]         = useState(1); // 1=name+color, 2=invite members
  const [name, setName]         = useState('');
  const [color, setColor]       = useState(COLORS[0]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const filtered = useMemo(() =>
    members.filter(m => m.name.toLowerCase().includes(search.toLowerCase())),
    [members, search]
  );

  const toggleMember = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Group name is required.'); return; }
    setLoading(true);
    setError('');
    const result = await onCreate(name.trim(), [...selected], color);
    setLoading(false);
    if (result) onClose();
    else setError('Failed to create group. Try again.');
  };

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const overlay  = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  const card     = dark
    ? 'bg-[#1a1a2e] border border-white/10 text-white'
    : 'bg-white border border-slate-200 text-slate-900';
  const inputCls = dark
    ? 'bg-white/8 border border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/60'
    : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-violet-400';
  const subText  = dark ? 'text-white/40' : 'text-slate-400';
  const divider  = dark ? 'border-white/8' : 'border-slate-100';
  const rowHover = dark ? 'hover:bg-white/5' : 'hover:bg-slate-50';
  const nameText = dark ? 'text-white' : 'text-slate-800';
  const roleText = dark ? 'text-white/35' : 'text-slate-400';

  return (
    <div className={overlay} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${card}`}
        style={{ animation: 'scaleIn .18s ease' }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${divider}`}>
          {step === 2 && (
            <button onClick={() => setStep(1)} className={`p-1 rounded-full ${dark ? 'hover:bg-white/10' : 'hover:bg-slate-100'} transition-colors`}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="font-bold text-base">
              {step === 1 ? 'New Group Chat' : 'Add Members'}
            </h2>
            <p className={`text-xs mt-0.5 ${subText}`}>
              {step === 1 ? 'Set a name and pick a color' : `${selected.size} member${selected.size !== 1 ? 's' : ''} selected`}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${dark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── STEP 1: Name + Color ───────────────────────────────────────── */}
        {step === 1 && (
          <div className="px-5 py-5 space-y-5">
            {/* Preview avatar */}
            <div className="flex justify-center">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Users className="w-9 h-9 text-white" />
              </div>
            </div>

            {/* Color picker */}
            <div>
              <p className={`text-xs font-semibold mb-2 ${subText} uppercase tracking-wider`}>Color</p>
              <div className="flex items-center gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${c} transition-all duration-150 ${
                      color === c ? 'ring-2 ring-offset-2 ring-violet-500 scale-110' : 'opacity-70 hover:opacity-100'
                    } ${dark ? 'ring-offset-[#1a1a2e]' : 'ring-offset-white'}`}
                  />
                ))}
              </div>
            </div>

            {/* Group name */}
            <div>
              <p className={`text-xs font-semibold mb-2 ${subText} uppercase tracking-wider`}>Group Name</p>
              <input
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Project Team, Study Group…"
                maxLength={100}
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 ${inputCls}`}
                onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
              />
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>

            {/* Next button */}
            <button
              onClick={() => {
                if (!name.trim()) { setError('Group name is required.'); return; }
                setError('');
                setStep(2);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all shadow-md shadow-violet-500/20"
            >
              Next — Add Members
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Select Members ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col" style={{ maxHeight: '60vh' }}>
            {/* Search */}
            <div className="px-4 pt-4 pb-2 shrink-0">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${subText}`} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search members…"
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all duration-200 ${inputCls}`}
                />
              </div>
            </div>

            {/* Selected chips */}
            {selected.size > 0 && (
              <div className={`px-4 pb-2 flex flex-wrap gap-1.5 shrink-0 border-b ${divider}`}>
                {[...selected].map(id => {
                  const m = members.find(m => m.id === id);
                  if (!m) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => toggleMember(id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-500 text-xs font-medium hover:bg-violet-500/25 transition-colors"
                    >
                      {m.name.split(' ')[0]}
                      <X className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Member list */}
            <div className="flex-1 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: 'thin' }}>
              {filtered.length === 0 && (
                <p className={`text-center text-sm py-8 ${subText}`}>No members found</p>
              )}
              {filtered.map(m => {
                const isChecked = selected.has(m.id);
                const bg = avatarColor(m.name);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left ${rowHover}`}
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className={`bg-gradient-to-br ${bg} text-white font-bold text-sm`}>
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${nameText}`}>{m.name}</p>
                      <p className={`text-xs truncate ${roleText}`}>{m.position || m.role}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
                      isChecked
                        ? 'bg-violet-500 border-violet-500'
                        : dark ? 'border-white/20' : 'border-slate-300'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create button */}
            <div className={`px-4 py-4 border-t shrink-0 ${divider}`}>
              {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all shadow-md shadow-violet-500/20 disabled:opacity-50"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>
                      <Users className="w-4 h-4" />
                      Create Group{selected.size > 0 ? ` with ${selected.size} member${selected.size !== 1 ? 's' : ''}` : ''}
                    </>
                }
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scaleIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  );
}