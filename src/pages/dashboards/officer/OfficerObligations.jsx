import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Plus, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertTriangle,
  Loader2, DollarSign, AlertCircle, Search, Users, Undo2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PageLoader from '@/components/ui/PageLoader';

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const getOrgId = () => {
  const orgId = localStorage.getItem('organization_id');
  if (orgId && orgId !== '' && orgId !== 'null' && orgId !== 'undefined') return parseInt(orgId);
  try {
    const m = JSON.parse(localStorage.getItem('membership') || 'null');
    if (m?.organization_id) return m.organization_id;
  } catch {}
  return null;
};

export default function OfficerObligations() {
  const orgId = getOrgId();
  const [consequences, setConsequences] = useState([]);
  const [fees, setFees] = useState([]);
  const [rules, setRules] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState({});

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const [oblRes, rulesRes, membersRes] = await Promise.all([
        axios.get(`/api/organizations/${orgId}/obligations`, authH()),
        axios.get(`/api/organizations/${orgId}/consequence-rules`, authH()),
        axios.get(`/api/organizations/${orgId}/members?status=active`, authH()),
      ]);
      setConsequences(oblRes.data.consequences || []);
      setFees(oblRes.data.fees || []);
      setRules(rulesRes.data || []);
      setMembers(membersRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load obligations.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group all items by student
  const allItems = [...fees, ...consequences];
  const studentMap = {};
  allItems.forEach(item => {
    const uid = item.user?.id;
    if (!uid) return;
    if (!studentMap[uid]) {
      studentMap[uid] = {
        id: uid,
        name: item.user?.name || '—',
        student_number: item.user?.student_number || '',
        items: [],
      };
    }
    studentMap[uid].items.push(item);
  });

  // Also include members with no obligations
  members.forEach(m => {
    const uid = m.user_id;
    if (!studentMap[uid]) {
      studentMap[uid] = {
        id: uid,
        name: `${m.user?.first_name || ''} ${m.user?.last_name || ''}`.trim(),
        student_number: m.user?.student_number || '',
        items: [],
      };
    }
  });

  const studentList = Object.values(studentMap).sort((a, b) => a.name.localeCompare(b.name));

  // Filter by search
  const filtered = studentList.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.student_number.toLowerCase().includes(q);
  });

  const toggleExpand = (id) => {
    setExpandedStudents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Fee actions
  const handleMarkPaid = async (feeId) => {
    try {
      await axios.put(`/api/membership-fees/${feeId}/status`, { status: 'paid' }, authH());
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update.');
    }
  };

  const handleUndoPaid = async (feeId) => {
    try {
      await axios.put(`/api/membership-fees/${feeId}/status`, { status: 'pending' }, authH());
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update.');
    }
  };

  // Consequence actions
  const handleCompleteConsequence = async (id) => {
    try {
      await axios.put(`/api/obligations/${id}`, { status: 'completed' }, authH());
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update.');
    }
  };

  const handleUndoConsequence = async (id) => {
    try {
      await axios.put(`/api/obligations/${id}`, { status: 'pending' }, authH());
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update.');
    }
  };

  // Stats
  const totalFees = fees.length;
  const paidFees = fees.filter(f => f.status === 'completed').length;
  const totalConsequences = consequences.length;
  const completedConsequences = consequences.filter(c => c.status === 'completed').length;

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm">No organization found for your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Obligations</h1>
          <p className="text-slate-600 mt-1 text-sm">Track fees and consequences per member</p>
        </div>
        <Button
          onClick={() => setShowAssign(true)}
          className="gap-2 bg-gradient-to-r from-violet-600 to-violet-700"
        >
          <Plus className="w-4 h-4" /> Assign Consequence
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2 pt-3 px-4"><CardDescription className="text-xs">Members</CardDescription></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-center gap-2"><Users className="w-5 h-5 text-slate-400" /><span className="text-2xl font-bold text-slate-900">{studentList.length}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-4"><CardDescription className="text-xs">Fees Collected</CardDescription></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" /><span className="text-2xl font-bold text-slate-900">{paidFees} / {totalFees}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-4"><CardDescription className="text-xs">Consequences Resolved</CardDescription></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /><span className="text-2xl font-bold text-slate-900">{completedConsequences} / {totalConsequences}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-4"><CardDescription className="text-xs">Rules</CardDescription></CardHeader>
          <CardContent className="px-4 pb-3"><div className="text-2xl font-bold text-slate-900">{rules.length}</div></CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name or student number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <PageLoader text="Loading Obligations..." />
      )}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-700 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* Student Accordion List */}
      {!loading && !error && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No members found.</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map(student => {
              const isOpen = expandedStudents[student.id];
              const studentFees = student.items.filter(i => i.type === 'fee');
              const studentConseq = student.items.filter(i => i.type === 'consequence');
              const paidCount = studentFees.filter(f => f.status === 'completed').length;
              const completedCons = studentConseq.filter(c => c.status === 'completed').length;
              const totalObl = student.items.length;
              const doneObl = paidCount + completedCons;
              const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

              return (
                <Card key={student.id} className="overflow-hidden">
                  {/* Student Header Row */}
                  <button
                    onClick={() => toggleExpand(student.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.student_number || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Fee progress */}
                      {studentFees.length > 0 && (
                        <div className="hidden sm:flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
                            {paidCount} / {studentFees.length} Fees Paid
                          </span>
                          <div className="w-16">
                            <Progress
                              value={studentFees.length > 0 ? (paidCount / studentFees.length) * 100 : 0}
                              className="h-2"
                            />
                          </div>
                        </div>
                      )}
                      {/* Consequence progress */}
                      {studentConseq.length > 0 && (
                        <div className="hidden sm:flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
                            {completedCons} / {studentConseq.length} Resolved
                          </span>
                        </div>
                      )}
                      {totalObl === 0 && (
                        <span className="text-xs text-slate-400 hidden sm:inline">No obligations</span>
                      )}
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isOpen && (
                    <div className="border-t border-slate-100 px-4 sm:px-5 pb-4 space-y-2 bg-slate-50/50">
                      {student.items.length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center">No obligations assigned yet.</p>
                      ) : (
                        student.items.map(item => (
                          <div
                            key={`${item.type}-${item.id}`}
                            className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 mt-2 border transition-all ${
                              item.status === 'completed'
                                ? 'bg-white border-l-4 border-l-emerald-400 border-t-slate-100 border-r-slate-100 border-b-slate-100'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                                {item.type === 'consequence' && (
                                  <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200 px-1.5 py-0">
                                    Consequence
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                {item.status === 'completed' ? (
                                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <CheckCircle2 className="w-3 h-3" /> {item.type === 'fee' ? 'Paid' : 'Completed'}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                                    <Clock className="w-3 h-3" /> Pending
                                  </span>
                                )}
                                {item.description && <span className="text-slate-400">{item.description}</span>}
                                {item.due_date && <span>Due: {item.due_date}</span>}
                                {item.event_title && <span>Event: {item.event_title}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {item.amount && (
                                <span className="font-bold text-slate-900 text-sm">₱{parseFloat(item.amount).toFixed(2)}</span>
                              )}
                              {item.type === 'fee' && item.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8 px-4"
                                  onClick={() => handleMarkPaid(item.id)}
                                >
                                  Mark as Paid
                                </Button>
                              )}
                              {item.type === 'fee' && item.status === 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full text-xs h-8 px-4"
                                  onClick={() => handleUndoPaid(item.id)}
                                >
                                  Undo
                                </Button>
                              )}
                              {item.type === 'consequence' && item.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8 px-4"
                                  onClick={() => handleCompleteConsequence(item.id)}
                                >
                                  Mark Done
                                </Button>
                              )}
                              {item.type === 'consequence' && item.status === 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full text-xs h-8 px-4"
                                  onClick={() => handleUndoConsequence(item.id)}
                                >
                                  Undo
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <AssignConsequenceDialog
          orgId={orgId}
          rules={rules}
          members={members}
          onClose={() => setShowAssign(false)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}

function AssignConsequenceDialog({ orgId, rules, members, onClose, onSaved }) {
  const [ruleId, setRuleId] = useState('');
  const [userId, setUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!ruleId || !userId) {
      setError('Please select a consequence rule and a member.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await axios.post(`/api/organizations/${orgId}/obligations`, {
        consequence_rule_id: parseInt(ruleId),
        user_id: parseInt(userId),
        due_date: dueDate || null,
        notes: notes || null,
      }, authH());
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign consequence.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-violet-600" />
            Assign Consequence
          </DialogTitle>
          <DialogDescription>Assign a consequence to a member who violated a rule or missed an event.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="space-y-2">
            <Label>Consequence Rule *</Label>
            <Select value={ruleId} onValueChange={setRuleId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a rule…" /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {rules.map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.consequence_title} {r.event?.title ? `(${r.event.title})` : '(All Events)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Member *</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a member…" /></SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                {members.map(m => (
                  <SelectItem key={m.user_id} value={String(m.user_id)}>
                    {m.user?.first_name} {m.user?.last_name} ({m.user?.student_number || '—'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due Date <span className="text-slate-400 text-xs">(optional — defaults from rule)</span></Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label>Notes <span className="text-slate-400 text-xs">(optional)</span></Label>
            <Input placeholder="e.g. Absent during midterm assembly" value={notes} onChange={e => setNotes(e.target.value)} className="rounded-xl" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
