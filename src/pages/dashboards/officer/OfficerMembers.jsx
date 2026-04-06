import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Users, Search, Mail, Phone, MoreVertical, UserPlus,
  X, ChevronDown, Shield, User, Briefcase, Loader2,
  AlertCircle, CheckCircle2, ArrowUpCircle, Copy,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AvatarImg from '@/components/Avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import MemberDetailsModal from '@/pages/modals/MemberDetailsModal';

// ── Same pattern as OfficerEvents — axios with relative /api URLs via Vite proxy ──
const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const apiFetch = async (path, options = {}) => {
  const method = (options.method ?? 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : undefined;
  let res;
  if (method === 'GET') res = await axios.get(`/api${path}`, authH());
  else if (method === 'POST') res = await axios.post(`/api${path}`, body, authH());
  else if (method === 'PATCH') res = await axios.patch(`/api${path}`, body, authH());
  else if (method === 'PUT') res = await axios.put(`/api${path}`, body, authH());
  else if (method === 'DELETE') res = await axios.delete(`/api${path}`, authH());
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Role helpers
// ─────────────────────────────────────────────────────────────────────────────
const ROLES = ['Member', 'Officer', 'Adviser', 'President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor'];

const roleConfig = {
  Officer: { label: 'Officer', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', Icon: Shield },
  Adviser: { label: 'Adviser', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', Icon: Briefcase },
  Member: { label: 'Member', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', Icon: User },
};

const getRoleConfig = (designation) => {
  if (!designation) return roleConfig.Member;
  if (roleConfig[designation]) return roleConfig[designation];
  if (designation !== 'Member') return roleConfig.Officer; // Default fallback for custom officer roles
  return roleConfig.Member;
};

const RoleBadge = ({ designation }) => {
  const cfg = getRoleConfig(designation);
  return (
    <Badge variant="outline" className={`text-xs px-2 py-0.5 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {designation || 'Member'}
    </Badge>
  );
};

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
const Toast = ({ toasts, dismiss }) => (
  <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium transition-all
          ${t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
      >
        {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
        <span>{t.message}</span>
        <button onClick={() => dismiss(t.id)} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3 h-3" /></button>
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const push = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };
  const dismiss = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, push, dismiss };
};

// ─────────────────────────────────────────────────────────────────────────────
// Promote / Edit-Role Dialog
// ─────────────────────────────────────────────────────────────────────────────
const POSITIONS = [
  'President', 'Vice President', 'Secretary', 'Treasurer',
  'Auditor', 'P.R.O.', 'Sergeant-at-Arms', 'Business Manager', 'Other',
];

const PromoteDialog = ({ membership, orgId, onClose, onSaved, pushToast }) => {
  const [designation, setDesignation] = useState(membership.designation || 'Member');
  const isPreset = ROLES.some(p => p.toLowerCase() === designation.toLowerCase());
  const [positionSelect, setPositionSelect] = useState(isPreset ? designation : (designation ? 'Other' : ''));
  const [customPosition, setCustomPosition] = useState(isPreset ? '' : designation);
  const [saving, setSaving] = useState(false);

  const handlePositionChange = (v) => {
    setPositionSelect(v);
    if (v !== 'Other') {
      setCustomPosition('');
      setDesignation(v);
    }
  };

  const fullName = membership.user
    ? `${membership.user.first_name} ${membership.user.last_name}`
    : '—';

  const finalDesignation = positionSelect === 'Other' ? customPosition.trim() : positionSelect;

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/organizations/${orgId}/members/${membership.id}`, {
        method: 'PUT',
        body: JSON.stringify({ designation: finalDesignation }),
      });
      pushToast(`${fullName}'s designation updated to ${finalDesignation}.`);
      onSaved({ ...membership, designation: finalDesignation });
      onClose();
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-purple-600" />
            Change Role
          </DialogTitle>
          <DialogDescription>
            Update role and position for <strong>{fullName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Designation</Label>
            <Select value={positionSelect} onValueChange={handlePositionChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a designation…" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {ROLES.map(r => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>



          {positionSelect === 'Other' && (
            <div className="space-y-2">
              <Label>Custom Designation</Label>
              <Input
                placeholder="e.g. Committee Head…"
                value={customPosition}
                onChange={e => {
                  setCustomPosition(e.target.value);
                  setDesignation(e.target.value);
                }}
                className="rounded-xl"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Add Member Dialog
// ─────────────────────────────────────────────────────────────────────────────
const AddMemberDialog = ({ orgId, onClose, onAdded, pushToast }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [designation, setDesignation] = useState('Member');
  const [customPos, setCustomPos] = useState('');
  const [saving, setSaving] = useState(false);
  const debounce = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await apiFetch(`/organizations/${orgId}/students/search?q=${encodeURIComponent(q)}`);
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [orgId]);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(debounce.current);
  }, [query, doSearch]);

  const handleAdd = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const finalDesignation = designation === 'Other' ? customPos.trim() : designation;
      const data = await apiFetch(`/organizations/${orgId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: selected.id, designation: finalDesignation }),
      });
      pushToast(`${selected.full_name} added as ${finalDesignation}.`);
      onAdded(data.membership || data);
      onClose();
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Add Member
          </DialogTitle>
          <DialogDescription>Search for a student and assign their role.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Search students */}
          <div className="space-y-2">
            <Label>Search Student</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Name or student number…"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null); }}
                className="pl-10 rounded-xl"
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
            </div>

            {/* Results list */}
            {results.length > 0 && !selected && (
              <div className="border rounded-xl overflow-hidden shadow-sm max-h-48 overflow-y-auto">
                {results.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelected(s); setResults([]); setQuery(s.full_name); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b last:border-b-0 transition-colors"
                  >
                    <p className="font-medium text-slate-900 text-sm">{s.full_name}</p>
                    <p className="text-xs text-slate-500">{s.student_number} · {s.course} · {s.year_level}</p>
                  </button>
                ))}
              </div>
            )}

            {query && !searching && results.length === 0 && !selected && (
              <p className="text-sm text-slate-400 text-center py-2">No students found or all are already members.</p>
            )}
          </div>

          {/* Designation */}
          <div className="space-y-2">
            <Label>Designation</Label>
            <Select value={designation} onValueChange={(v) => { setDesignation(v); if (v !== 'Other') setCustomPos(''); }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a designation…" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Other">Other (Custom)</SelectItem>
                {ROLES.map(r => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {designation === 'Other' && (
            <div className="space-y-2">
              <Label>Custom Designation</Label>
              <Input
                placeholder="e.g. Committee Head…"
                value={customPos}
                onChange={e => setCustomPos(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={handleAdd}
            disabled={!selected || saving}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Confirm Remove Dialog
// ─────────────────────────────────────────────────────────────────────────────
const ConfirmRemoveDialog = ({ membership, orgId, onClose, onRemoved, pushToast }) => {
  const [loading, setLoading] = useState(false);
  const fullName = membership.user
    ? `${membership.user.first_name} ${membership.user.last_name}`
    : '—';

  const handleRemove = async () => {
    setLoading(true);
    try {
      await apiFetch(`/organizations/${orgId}/members/${membership.id}`, { method: 'DELETE' });
      pushToast(`${fullName} has been removed.`);
      onRemoved(membership.id);
      onClose();
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Remove Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{fullName}</strong> from the organization?
            Their membership will be set to inactive.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={loading}
            className="rounded-xl gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Member Details Dialog
// ─────────────────────────────────────────────────────────────────────────────
const MemberDetailsDialog = ({ membership, onClose }) => {
  if (!membership) return null;
  const s = membership.user || {};
  const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown';

  return (
    <Dialog open={!!membership} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden p-0 border-0 shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 flex flex-col items-center justify-center text-white relative">
          <AvatarImg name={fullName} src={s.profile_picture_url || null} size={96} className="border-4 border-white/20 shadow-xl mb-4" />
          <h2 className="text-2xl font-bold text-center tracking-tight">{fullName}</h2>
          <p className="text-white/80 font-mono text-sm mt-1">{s.student_number || 'No ID'}</p>
          <div className="absolute top-4 right-4">
            <RoleBadge designation={membership.designation} />
          </div>
        </div>

        <div className="p-6 space-y-4 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">Course & Year</p>
              <p className="font-semibold text-slate-900 text-sm">{(typeof s.course === 'object' ? s.course?.name : s.course) || '—'} · {s.year_level || '—'}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">Designation</p>
              <p className="font-semibold text-slate-900 text-sm">{membership.designation || '—'}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 mb-0.5">Email Address</p>
                <p className="text-sm font-medium text-slate-900 truncate">{s.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Contact Number</p>
                <p className="text-sm font-medium text-slate-900">{s.contact_number || '—'}</p>
              </div>
            </div>

            {/* Show RFID if available or let them know it's missing */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${s.rfid_uid ? 'bg-purple-50' : 'bg-slate-50'}`}>
                <Shield className={`w-4 h-4 ${s.rfid_uid ? 'text-purple-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">RFID Card</p>
                <p className={`text-sm font-mono font-medium ${s.rfid_uid ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {s.rfid_uid ? s.rfid_uid : 'Not registered'}
                </p>
              </div>
            </div>
          </div>

          {membership.attendance_rate != null && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-slate-900">Overall Attendance</p>
                <span className="text-sm font-bold text-blue-600">{membership.attendance_rate}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden w-full relative">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  style={{ width: `${membership.attendance_rate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
/**
 * OfficerMembers
 * @prop {number|string} [orgId]  — optional; if omitted, resolved automatically
 *                                  from the logged-in officer's /me response.
 */
export default function OfficerMembers({ orgId: orgIdProp }) {
  // ── resolve orgId from logged-in user when no prop supplied ──────────────
  const [orgId, setOrgId] = useState(orgIdProp ?? null);
  const [orgName, setOrgName] = useState('');
  const [authLoading, setAuthLoading] = useState(!orgIdProp);  // false immediately if prop given
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (orgIdProp) { setOrgId(orgIdProp); return; }          // prop wins
    (async () => {
      try {
        const me = await apiFetch('/me');
        // /me returns { user, role, membership, organization_id }

        if (!me?.organization_id) {
          setAuthError('You are not assigned as an officer in any organization.');
          return;
        }
        setOrgId(me.organization_id);
        setOrgName(me?.membership?.organization?.name ?? '');
      } catch (err) {
        setAuthError(err.message);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, [orgIdProp]);

  // ── state ────────────────────────────────────────────────────────────────
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orgDetails, setOrgDetails] = useState(null);

  useEffect(() => {
    if (!orgId) return;
    apiFetch(`/organizations/${orgId}`)
      .then(data => setOrgDetails(data))
      .catch(err => console.error("Failed to load org details", err));
  }, [orgId]);

  // modals
  const [showAdd, setShowAdd] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState(null);   // membership object
  const [removeTarget, setRemoveTarget] = useState(null);   // membership object
  const [selectedMember, setSelectedMember] = useState(null); // membership object

  const { toasts, push: pushToast, dismiss } = useToast();

  // ── fetch members — waits until orgId is resolved ───────────────────────
  const fetchMembers = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(
        `/organizations/${orgId}/members?status=all${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`
      );
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId, searchQuery]);

  // Debounced search
  const searchDebounce = useRef(null);
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(fetchMembers, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [fetchMembers]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleAdded = (membership) => {
    setMembers(prev => [membership, ...prev]);
  };

  const handleRoleSaved = (updated) => {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const handleRemoved = (membershipId) => {
    setMembers(prev => prev.filter(m => m.id !== membershipId));
  };

  const handleApprove = async (membershipId) => {
    try {
      await apiFetch(`/organizations/${orgId}/members/${membershipId}/approve`, { method: 'POST' });
      pushToast('Join request approved!');
      setMembers(prev => prev.map(m => m.id === membershipId ? { ...m, status: 'active' } : m));
    } catch (err) {
      pushToast(err.message, 'error');
    }
  };

  const handleReject = async (membershipId) => {
    try {
      await apiFetch(`/organizations/${orgId}/members/${membershipId}/reject`, { method: 'POST' });
      pushToast('Join request rejected.');
      setMembers(prev => prev.filter(m => m.id !== membershipId));
    } catch (err) {
      pushToast(err.message, 'error');
    }
  };

  const activeMembersList = members.filter(m => m.status === 'active');
  const pendingMembersList = members.filter(m => m.status === 'pending');

  // ── derived stats ────────────────────────────────────────────────────────
  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    officers: members.filter(m => m.designation !== 'Member').length,
    avgAttendance: members.length
      ? Math.round(members.reduce((s, m) => s + (m.attendance_rate ?? 0), 0) / members.length)
      : 0,
  };

  // ── row actions dropdown ──────────────────────────────────────────────────
  const MemberActions = ({ membership }) => (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl w-44">
          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onClick={() => setPromoteTarget(membership)}
          >
            <ArrowUpCircle className="w-4 h-4 text-purple-500" />
            Change Designation
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-red-600 cursor-pointer focus:text-red-600"
            onClick={() => setRemoveTarget(membership)}
          >
            <X className="w-4 h-4" />
            Remove Member
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // ── helper: get student full name ────────────────────────────────────────
  const fullName = (m) => m.user
    ? `${m.user.first_name} ${m.user.last_name}`
    : 'Unknown';

  const studentId = (m) => m.user?.student_number ?? '—';
  const email = (m) => m.user?.email ?? '—';
  const phone = (m) => m.user?.contact_number ?? '—';
  const course = (m) => m.user?.course?.name ?? m.user?.course ?? '—';
  const yearLevel = (m) => m.user?.year_level ?? '—';

  // ── render ────────────────────────────────────────────────────────────────

  // Still resolving org from /me
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading your organization…</span>
      </div>
    );
  }

  // Could not determine org (not an officer, or API error)
  if (authError || !orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm">{authError ?? 'No organization found for your account.'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 sm:space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Members</h1>
            <p className="text-slate-600 mt-1 text-sm">
              {orgName ? `Managing · ${orgName}` : 'Manage organization members'}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {orgDetails?.invite_code && (
              <div 
                onClick={() => {
                  navigator.clipboard.writeText(orgDetails.invite_code);
                  pushToast('Invite code copied to clipboard!');
                }}
                className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                title="Click to copy invite code"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-600/70">Invite Code:</span>
                <span className="font-mono font-bold tracking-widest">{orgDetails.invite_code}</span>
                <Copy className="w-3.5 h-3.5 ml-1 opacity-50" />
              </div>
            )}
            <Button
              onClick={() => setShowAdd(true)}
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 h-9 text-sm shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Member</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Members', value: stats.total },
            { label: 'Active Members', value: stats.active },
            { label: 'Officers / Advisers', value: stats.officers },
            { label: 'Avg. Attendance', value: `${stats.avgAttendance}%` },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardDescription className="text-xs sm:text-sm">{label}</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or student number…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        {!loading && !error && pendingMembersList.length > 0 && (
          <Card className="border-amber-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
            <CardHeader className="pb-3 border-b border-slate-100 bg-amber-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg text-amber-900">Pending Join Requests</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-amber-700/80">Students waiting for approval</CardDescription>
                </div>
                <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200">
                  {pendingMembersList.length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {pendingMembersList.map(m => (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarImg name={fullName(m)} src={m.user?.profile_picture_url || null} size={40} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{fullName(m)}</p>
                      <p className="text-xs text-slate-500 font-mono">{studentId(m)} · {course(m)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleApprove(m.id)} className="h-8 gap-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-3">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(m.id)} className="h-8 gap-1 rounded-lg text-slate-600 hover:text-red-600 px-3">
                      <X className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Member list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Member List</CardTitle>
            <CardDescription className="text-xs sm:text-sm">All active organization members</CardDescription>
          </CardHeader>
          <CardContent>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading members…</span>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchMembers} className="rounded-xl">
                  Retry
                </Button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && members.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <Users className="w-8 h-8" />
                <p className="text-sm">No members found.</p>
                <Button
                  size="sm"
                  onClick={() => setShowAdd(true)}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Add First Member
                </Button>
              </div>
            )}

            {/* Data */}
            {!loading && !error && members.length > 0 && (
              <>
                {/* ── Mobile cards ── */}
                <div className="sm:hidden space-y-3">
                  {activeMembersList.map(m => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                      onClick={() => setSelectedMember(m)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <AvatarImg name={fullName(m)} src={m.user?.profile_picture_url || null} size={40} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm">{fullName(m)}</p>
                            <p className="text-xs text-slate-500 font-mono">{studentId(m)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <RoleBadge designation={m.designation} />
                          <MemberActions membership={m} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{email(m)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{phone(m)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{course(m)} · {yearLevel(m)}</span>
                        <Badge className="bg-green-100 text-green-700 text-[10px]">active</Badge>
                      </div>

                      {m.attendance_rate != null && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                              style={{ width: `${m.attendance_rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 shrink-0">{m.attendance_rate}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* ── Desktop table ── */}
                <div className="hidden sm:block rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Course &amp; Year</TableHead>
                        <TableHead>Designation</TableHead>
                        {members.some(m => m.attendance_rate != null) && (
                          <TableHead>Attendance</TableHead>
                        )}
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeMembersList.map(m => (
                        <TableRow
                          key={m.id}
                          className="cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => setSelectedMember(m)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <AvatarImg name={fullName(m)} src={m.user?.profile_picture_url || null} size={40} />
                              <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{fullName(m)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{studentId(m)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-600 truncate max-w-[180px]">{email(m)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-600">{phone(m)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-slate-900">{course(m)}</p>
                            <p className="text-sm text-slate-600">{yearLevel(m)}</p>
                          </TableCell>
                          <TableCell><RoleBadge designation={m.designation} /></TableCell>
                          {members.some(mm => mm.attendance_rate != null) && (
                            <TableCell>
                              {m.attendance_rate != null ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                                      style={{ width: `${m.attendance_rate}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-slate-900">{m.attendance_rate}%</span>
                                </div>
                              ) : '—'}
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700">active</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <MemberActions membership={m} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <AddMemberDialog
          orgId={orgId}
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
          pushToast={pushToast}
        />
      )}

      {promoteTarget && (
        <PromoteDialog
          membership={promoteTarget}
          orgId={orgId}
          onClose={() => setPromoteTarget(null)}
          onSaved={handleRoleSaved}
          pushToast={pushToast}
        />
      )}

      {removeTarget && (
        <ConfirmRemoveDialog
          membership={removeTarget}
          orgId={orgId}
          onClose={() => setRemoveTarget(null)}
          onRemoved={handleRemoved}
          pushToast={pushToast}
        />
      )}

      {selectedMember && (
        <MemberDetailsModal
          membership={selectedMember}
          orgId={orgId}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* ── Toast notifications ── */}
      <Toast toasts={toasts} dismiss={dismiss} />
    </>
  );
}