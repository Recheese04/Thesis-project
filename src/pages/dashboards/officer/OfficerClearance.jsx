// pages/dashboards/officer/OfficerClearance.jsx

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Clock, XCircle, Search, ChevronDown, ChevronUp,
  Loader2, RefreshCw, AlertTriangle, Plus, DollarSign, FileText, ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import axios from 'axios';

const api = () =>
  axios.create({
    baseURL: '/api',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

const getOrgId = () => {
  const orgId = localStorage.getItem('organization_id');
  if (orgId && orgId !== '' && orgId !== 'null' && orgId !== 'undefined') {
    return parseInt(orgId);
  }
  try {
    const membership = JSON.parse(localStorage.getItem('membership') || 'null');
    if (membership?.organization_id) return membership.organization_id;
  } catch { }
  return null;
};

export default function OfficerClearance() {
  const orgId = getOrgId();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Add Requirement form state ──────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const emptyReq = { name: '', type: 'manual', category: 'other', description: '', amount: '' };
  const [newReq, setNewReq] = useState(emptyReq);

  const schoolYear = '2025-2026';
  const semester = '2nd';

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchClearance = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api().get(`/organizations/${orgId}/clearance`, {
        params: { school_year: schoolYear, semester },
      });
      setMembers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load clearance data.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchClearance(); }, [fetchClearance]);

  // ── Add Requirement ─────────────────────────────────────────────────────
  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (!newReq.name.trim()) return;
    setAddLoading(true);
    try {
      const isPayment = newReq.category === 'payment';
      await api().post(`/organizations/${orgId}/clearance-requirements`, {
        name: newReq.name.trim(),
        type: newReq.category === 'attendance' ? 'auto' : 'manual',
        description: newReq.description.trim() || null,
        amount: isPayment && newReq.amount ? parseFloat(newReq.amount) : null,
        school_year: schoolYear,
        semester,
      });
      setNewReq(emptyReq);
      setShowAddForm(false);
      fetchClearance();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add requirement.');
    } finally {
      setAddLoading(false);
    }
  };

  // ── Clear ────────────────────────────────────────────────────────────────
  const handleClear = async (studentId, requirementId, notes) => {
    const key = `clear-${studentId}-${requirementId}`;
    setActionLoading(key);
    try {
      await api().post(`/clearance/${requirementId}/students/${studentId}/clear`, {
        school_year: schoolYear,
        semester,
        notes: notes || null,
      });
      setMembers((prev) =>
        prev.map((m) => {
          if (m.student_id !== studentId) return m;
          const updatedReqs = m.requirements.map((r) =>
            r.requirement_id === requirementId ? { ...r, status: 'cleared' } : r
          );
          const clearedCount = updatedReqs.filter((r) => r.status === 'cleared').length;
          return { ...m, requirements: updatedReqs, cleared: clearedCount, overall: clearedCount === m.total ? 'cleared' : 'pending' };
        })
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clear requirement.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject ───────────────────────────────────────────────────────────────
  const handleReject = async (studentId, requirementId) => {
    const key = `reject-${studentId}-${requirementId}`;
    setActionLoading(key);
    try {
      await api().post(`/clearance/${requirementId}/students/${studentId}/reject`, {
        school_year: schoolYear,
        semester,
      });
      setMembers((prev) =>
        prev.map((m) => {
          if (m.student_id !== studentId) return m;
          const updatedReqs = m.requirements.map((r) =>
            r.requirement_id === requirementId ? { ...r, status: 'rejected' } : r
          );
          const clearedCount = updatedReqs.filter((r) => r.status === 'cleared').length;
          return { ...m, requirements: updatedReqs, cleared: clearedCount, overall: 'pending' };
        })
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject requirement.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = members.filter((m) => {
    const matchSearch = m.student_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.overall === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalCleared = members.filter((m) => m.overall === 'cleared').length;
  const totalPending = members.filter((m) => m.overall === 'pending').length;

  const StatusIcon = ({ status }) => {
    if (status === 'cleared') return <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-500   flex-shrink-0" />;
    return <Clock className="w-4 h-4 text-amber-500  flex-shrink-0" />;
  };

  if (!orgId) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-slate-500 text-sm">No organization found for your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clearance Management</h1>
          <p className="text-slate-600 mt-1">{schoolYear} — {semester} Semester</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddForm(true)} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Add Requirement
          </Button>
          <Button variant="outline" onClick={fetchClearance} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Add Requirement Modal */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Clearance Requirement</DialogTitle>
            <DialogDescription>
              Create a new requirement that all members need to fulfill.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddRequirement} className="space-y-4 mt-2">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'payment', label: 'Payment / Fee', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                  { key: 'document', label: 'Document Submission', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                  { key: 'attendance', label: 'Attendance', icon: ClipboardList, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                  { key: 'other', label: 'Other', icon: CheckCircle, color: 'text-slate-600 bg-slate-50 border-slate-200' },
                ].map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setNewReq({
                        ...newReq,
                        category: key,
                        name: key === 'attendance' ? 'Minimum Attendance (80%)' : (key === newReq.category ? newReq.name : ''),
                      });
                    }}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm font-medium transition-all
                      ${newReq.category === key
                        ? `${color} ring-2 ring-violet-400`
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Requirement Name *</label>
              <input
                type="text"
                value={newReq.name}
                onChange={(e) => setNewReq({ ...newReq, name: e.target.value })}
                placeholder={newReq.category === 'payment' ? 'e.g. Membership Dues' : newReq.category === 'document' ? 'e.g. Signed Waiver Form' : 'Requirement name'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
                disabled={newReq.category === 'attendance'}
              />
            </div>

            {/* Amount (only for payment) */}
            {newReq.category === 'payment' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₱)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newReq.amount}
                    onChange={(e) => setNewReq({ ...newReq, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Leave blank if amount varies per student</p>
              </div>
            )}

            {/* Attendance auto note */}
            {newReq.category === 'attendance' && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">
                  <strong>Auto-computed:</strong> This requirement is automatically cleared when a student reaches 80% attendance across all completed events.
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
              <textarea
                rows={2}
                value={newReq.description}
                onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                placeholder={newReq.category === 'payment' ? 'e.g. Payment deadline, accepted modes of payment...' : 'Additional details about this requirement'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button type="submit" disabled={addLoading} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                {addLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Requirement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Overall Cleared</CardDescription></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {members.length > 0 ? Math.round((totalCleared / members.length) * 100) : 0}%
              </div>
              <Progress value={members.length > 0 ? (totalCleared / members.length) * 100 : 0} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Members Cleared</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-9 h-9 text-green-600" />
                <span className="text-3xl font-bold text-slate-900">{totalCleared}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Members Pending</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Clock className="w-9 h-9 text-amber-500" />
                <span className="text-3xl font-bold text-slate-900">{totalPending}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'cleared', 'pending'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                ${filterStatus === s ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </CardContent>
        </Card>
      )}

      {/* Members */}
      {!loading && !error && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">No members found.</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((member) => (
              <Card key={member.student_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  {/* Member row */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {member.student_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 truncate">{member.student_name}</span>
                          {member.position && <span className="text-xs text-slate-400">• {member.position}</span>}
                          <Badge className={member.overall === 'cleared' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {member.overall === 'cleared' ? 'Cleared' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 max-w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full transition-all"
                              style={{ width: `${member.total > 0 ? (member.cleared / member.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{member.cleared}/{member.total} done</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === member.student_id ? null : member.student_id)}
                      className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                    >
                      {expandedId === member.student_id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Expanded requirements */}
                  {expandedId === member.student_id && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      {member.requirements.map((req) => {
                        const clearKey = `clear-${member.student_id}-${req.requirement_id}`;
                        const rejectKey = `reject-${member.student_id}-${req.requirement_id}`;
                        const busy = actionLoading === clearKey || actionLoading === rejectKey;

                        return (
                          <div key={req.requirement_id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-50">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="mt-0.5"><StatusIcon status={req.status} /></div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{req.name}</p>
                                {req.notes && <p className="text-xs text-slate-500 mt-0.5">{req.notes}</p>}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {req.status === 'cleared' ? (
                                <Badge className="bg-green-100 text-green-700 text-xs">Cleared</Badge>
                              ) : req.status === 'rejected' ? (
                                <Badge className="bg-red-100 text-red-600 text-xs">Rejected</Badge>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm" disabled={busy}
                                    className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs px-3 gap-1"
                                    onClick={() => handleClear(member.student_id, req.requirement_id, req.notes)}
                                  >
                                    {actionLoading === clearKey && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Clear
                                  </Button>
                                  <Button
                                    size="sm" variant="outline" disabled={busy}
                                    className="text-red-600 hover:bg-red-50 h-7 text-xs px-3 gap-1"
                                    onClick={() => handleReject(member.student_id, req.requirement_id)}
                                  >
                                    {actionLoading === rejectKey && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}